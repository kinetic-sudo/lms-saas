import CompanionCard from "@/components/CompanionCard";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import { getAllCompanions } from "@/lib/action/companion.action";
import { getSubjectColor } from "@/lib/utils";

const CompanionLibrary = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  const subject = filters.subject ? filters.subject : '';
  const topic = filters.topic ? filters.topic : '';

  const companions = await getAllCompanions({ subject, topic });

  return (
    <main className="flex flex-col gap-8 w-full">
      {/* Header Section */}
      <section className="flex flex-col gap-6 w-full">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black tracking-tight">Companion Library</h1>
            <div className="text-sm text-slate-400 font-bold">
                {companions.length} Result{companions.length !== 1 && 's'}
            </div>
        </div>
        
        {/* Filter Bar - Flex container for Search & Filter Pills */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full border-b border-slate-100 pb-6">
            <div className="w-full md:w-auto">
                <SubjectFilter />
            </div>
             {/* Spacer to push search to right on large screens if desired, or keep left */}
            <div className="w-full md:w-auto md:ml-auto">
                <SearchInput />
            </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full pb-20">
        {companions.length > 0 ? (
          companions.map((companion) => (
            <CompanionCard 
                key={companion.id} 
                {...companion} 
                color={getSubjectColor(companion.subject)}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
             <p className="text-lg font-bold">No companions found</p>
             <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default CompanionLibrary