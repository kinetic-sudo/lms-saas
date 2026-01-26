'use client'

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "./ui/button"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
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

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log(values)
        toast.success("Companion is created", {
            description: "Your companion has been successfully created",
            
        })
    }

    return (

        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FieldGroup>
                <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="form-rhf-demo-title">
                                Companion Name
                            </FieldLabel>
                            <Input
                                {...field}
                                className="input"
                                id="form-rhf-demo-title"
                                aria-invalid={fieldState.invalid}
                                placeholder="Enter the companion name"
                                autoComplete="off"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />
                <Controller
                    name="subject"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="form-rhf-demo-title">
                                Subject Name
                            </FieldLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                <SelectTrigger className="input capitalize">
                                    <SelectValue placeholder="Select the subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem
                                            value={subject}
                                            key={subject}
                                            className="capitalize"
                                        >
                                            {subject}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />
                <Controller
                    name="topic"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="form-rhf-demo-title">
                                What should the companion help with ?
                            </FieldLabel>
                            <Textarea
                                {...field}
                                className="input"
                                id="form-rhf-demo-title"
                                aria-invalid={fieldState.invalid}
                                placeholder="Ex Derivates & Integrals"
                                autoComplete="off"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />
                 <Controller
                    name="voice"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="form-rhf-demo-title">
                                Voice Name
                            </FieldLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                <SelectTrigger className="input">
                                    <SelectValue placeholder="Select the voice" />
                                </SelectTrigger>
                                <SelectContent>
                                        <SelectItem value="male">
                                            Male
                                        </SelectItem>
                                        <SelectItem value="female">
                                            Female
                                        </SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />
                <Controller
                    name="style"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="form-rhf-demo-title">
                                Style Name
                            </FieldLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                <SelectTrigger className="input">
                                    <SelectValue placeholder="Select the voice" />
                                </SelectTrigger>
                                <SelectContent>
                                        <SelectItem value="formal">
                                            Formal
                                        </SelectItem>
                                        <SelectItem value="casual">
                                            Casual
                                        </SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />
                <Controller
                    name="duration"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="form-rhf-demo-title">
                                Estimated session duration in minutes
                            </FieldLabel>
                            <Input
                                {...field}
                                className="input"
                                type="number"
                                id="form-rhf-demo-title"
                                aria-invalid={fieldState.invalid}
                                placeholder="15"
                                autoComplete="off"
                            />
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

            </FieldGroup>
            <Button type="submit" className="w-full cursor-pointer">
             Build your companion
            </Button>
        </form>
    )
}

export default CompanionForm