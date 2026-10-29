import "server-only"

import { cache } from "react"

import { api } from "@/lib/api"
import type { User } from "@/lib/types"

export const getCurrentUser = cache(() => api<User>("/verify"))
