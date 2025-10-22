import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to dashboard for now
  // In a real app, you might want to show a landing page here
  redirect('/dashboard')
}