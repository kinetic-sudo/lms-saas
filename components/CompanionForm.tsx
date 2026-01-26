'use client'

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import {toast} from "sonner"

const formSchema = z.object({
    name: z
      .string()
      .min(1, "Companion is required"),
    subject: z
      .string()
      .min(1, "Subject is required"),
    topic: z 
      .string()
      .min(1, "Topic is required"),
    style: z
      .string()
      .min(1, "Style is required"),
    voice: z
      .string()
      .min(1, "Voice is required"),
    duration: z
      .coerce.number()
      .min(1, "Duration is required")
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

    function onSubmit(data: z.infer<typeof formSchema>) {
        toast("You submitted the following values:", {
          description: (
            <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          ),
          position: "bottom-right",
          classNames: {
            content: "flex flex-col gap-2",
          },
          style: {
            "--border-radius": "calc(var(--radius)  + 4px)",
          } as React.CSSProperties,
        })
      }

  return (
    <div>CompanionForm</div>
  )
}

export default CompanionForm