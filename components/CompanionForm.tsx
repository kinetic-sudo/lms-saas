'use client'

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { subjects } from "@/constants"
import { Textarea } from "./ui/textarea"
import { createCompanion } from "@/lib/action/companion.action"
import { redirect } from "next/navigation"
import { Zap } from "lucide-react" 


const formSchema = z.object({
    name: z.string().min(1, "Companion is required"),
    subject: z.string().min(1, "Subject is required"),
    topic: z.string().min(1, "Topic is required"),
    style: z.string().min(1, "Style is required"),
    voice: z.string().min(1, "Voice is required"),
    duration: z.number().min(1, "Duration is required")
})

const CompanionForm = () => {

    type FormSchema = z.infer<typeof formSchema>

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            subject: '',
            topic: '',
            style: '',
            voice: '',
            duration: 15
        }
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const companion = await createCompanion(values)

        toast.success("Companion is created", {
            description: "Your companion has been successfully created",
            
        })

        if(companion) {
            redirect(`/companion/${companion.id}`)
        } else {
            console.log('failed to create a companion')
            redirect('/')
        }
        
    }

    const labelClasses = "text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-1";
    
    // ADDED 'w-full' HERE to ensure SelectTrigger and Inputs fill the space
    const inputClasses = "w-full bg-slate-50/50 border border-slate-100 focus-visible:ring-black focus-visible:ring-offset-0 placeholder:text-slate-400 rounded-xl h-14 px-4 text-base font-medium shadow-none transition-all hover:bg-slate-50";

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* ROW 1: Name & Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className={labelClasses}>Companion Name</label>
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                className={inputClasses}
                                placeholder="Enter the companion name"
                                autoComplete="off"
                            />
                        )}
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClasses}>Subject Name</label>
                    <Controller
                        name="subject"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                {/* Added w-full explicit to SelectTrigger as well for safety */}
                                <SelectTrigger className={`${inputClasses} w-full capitalize`}>
                                    <SelectValue placeholder="Select the Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem value={subject} key={subject} className="capitalize">
                                            {subject}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            {/* ROW 2: Topic (Full Width) */}
            <div className="space-y-1">
                <label className={labelClasses}>What should the companion help with?</label>
                <Controller
                    name="topic"
                    control={form.control}
                    render={({ field }) => (
                        <Textarea
                            {...field}
                            className={`${inputClasses} min-h-[140px] py-4 resize-none`}
                            placeholder="Ex: Derivatives & Integrals, explaining complex theories in simple terms..."
                            autoComplete="off"
                        />
                    )}
                />
            </div>

            {/* ROW 3: Voice, Style, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                    <label className={labelClasses}>Voice Name</label>
                    <Controller
                        name="voice"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className={`${inputClasses} w-full`}>
                                    <SelectValue placeholder="Select the voice" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClasses}>Style Name</label>
                    <Controller
                        name="style"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className={`${inputClasses} w-full`}>
                                    <SelectValue placeholder="Select the style" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="formal">Formal</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClasses}>Duration (Min)</label>
                    <Controller
                        name="duration"
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : '')}
                                className={inputClasses}
                                type="number"
                                placeholder="15"
                            />
                        )}
                    />
                </div>
            </div>

            {/* FOOTER: Submit & Estimated Time */}
            <div className="pt-2 flex flex-col items-center gap-4">
                <Button 
                    type="submit" 
                    className="w-full bg-[#111111] hover:bg-black text-white h-16 rounded-2xl text-lg font-bold shadow-lg shadow-black/5 hover:scale-[1.01] transition-transform active:scale-[0.99] cursor-pointer"
                >
                    <Zap className="mr-2 h-5 w-5 fill-white" />
                    Build your companion
                </Button>
                
                <p className="text-sm text-slate-400 font-medium">
                    Estimated generation time: 30-45 seconds
                </p>
            </div>
        </form>
    )
}

export default CompanionForm