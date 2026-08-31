import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4">
      <SignIn />
    </div>
  )
}
