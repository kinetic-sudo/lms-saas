import CompanionForm from "@/components/CompanionForm"

const NewCompanion = () => {
  return (
    <main className="lg:w-1/2 md:w-1/3 items-center justify-center">
        <article className="w-full flex flex-col gap-4 ">
            <h1>Companion Builder</h1>

            <CompanionForm />
        </article>
    </main>
  )
}

export default NewCompanion