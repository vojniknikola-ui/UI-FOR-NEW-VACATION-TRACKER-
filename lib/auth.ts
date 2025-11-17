import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds guilds.members.read'
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Fetch user roles from Discord API
        const roles = await fetchDiscordUserRoles(user.id)
        session.user.roles = roles
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

async function fetchDiscordUserRoles(userId: string): Promise<string[]> {
  try {
    // Get user's guilds
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })

    if (!guildsResponse.ok) {
      console.error('Failed to fetch user guilds')
      return []
    }

    const guilds = await guildsResponse.json()
    const roles: string[] = []

    // For each guild, check member roles
    for (const guild of guilds) {
      const memberResponse = await fetch(
        `https://discord.com/api/guilds/${guild.id}/members/${userId}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      )

      if (memberResponse.ok) {
        const member = await memberResponse.json()
        roles.push(...member.roles)
      }
    }

    // Get server settings to determine admin/PM roles
    const serverSettings = await prisma.serverSetting.findMany()
    const adminRoles = serverSettings.map(s => s.adminRoleId).filter(Boolean)
    const pmRoles = serverSettings.map(s => s.pmRoleId).filter(Boolean)

    const userRoles: string[] = []
    if (roles.some(role => adminRoles.includes(role))) {
      userRoles.push('admin')
    }
    if (roles.some(role => pmRoles.includes(role))) {
      userRoles.push('pm')
    }
    userRoles.push('user') // Everyone is at least a user

    return userRoles
  } catch (error) {
    console.error('Error fetching Discord roles:', error)
    return ['user']
  }
}