import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { TaskApp } from "@/components/task-app"

export default async function Home() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <TaskApp />
    </div>
  )
}
