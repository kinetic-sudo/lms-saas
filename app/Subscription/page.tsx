import { PricingTable } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const Subscription = async () => {


  return (
    <main className="container mx-auto py-12">
           <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
        <PricingTable />
    </main>
  )
}

export default Subscription