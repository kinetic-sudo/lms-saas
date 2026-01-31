import CompanionCard from "@/components/CompanionCard";
import SearchInput from "@/components/SearchInput";
import SubjectFilter from "@/components/SubjectFilter";
import { getAllCompanions } from "@/lib/action/companion.action";
import { getSubjectColor } from "@/lib/utils";
import Link from "next/link";

const CompanionLibrary = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  const subject = filters.subject ? filters.subject : '';
  const topic = filters.topic ? filters.topic : '';

  const companions = await getAllCompanions({ subject, topic });
  const hasDummyData = companions.some(c => c.id.startsWith('dummy-'));

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
        
        {/* Show message for new users */}
        {hasDummyData && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white rounded-full p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">
                These are sample companions. Create your own to get started!
              </p>
            </div>
            <Link href="/companion/new">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition">
                Create Companion
              </button>
            </Link>
          </div>
        )}
        
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full border-b border-slate-100 pb-6">
            <div className="w-full md:w-auto">
                <SubjectFilter />
            </div>
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