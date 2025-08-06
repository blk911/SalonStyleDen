import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  contact: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, {
    message: "Phone number must be in the format XXX-XXX-XXXX.",
  }),
});

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contact: "",
    },
  });
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    let formattedInput = '';

    if (input.length > 0) {
      formattedInput = input.substring(0, 3);
    }
    if (input.length > 3) {
      formattedInput += '-' + input.substring(3, 6);
    }
    if (input.length > 6) {
      formattedInput += '-' + input.substring(6, 10);
    }
    
    form.setValue('contact', formattedInput);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      if (values.name === "admin" && values.contact === "000-000-0000") {
        toast({
          title: "Admin Access Granted",
          description: "Redirecting to admin dashboard...",
        });
        setLocation("/admin-dash");
      } else {
        toast({
          title: "Login Successful", 
          description: "Redirecting to your dashboard...",
        });
        setLocation("/u-dash");
      }
    } catch (error) {
      console.error("Error logging in: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while trying to log in.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg">
       <CardHeader className="items-center text-center p-6">
        <div className="p-3 bg-primary/10 rounded-full mb-4">
          <Terminal className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline">Admin Access</CardTitle>
        <CardDescription>Enter credentials to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-48 bg-gray-200 rounded-md mb-6 flex items-center justify-center">
          <span className="text-gray-500">Security Access Placeholder</span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="000-000-0000" {...field} onChange={(e) => {
                      field.onChange(e);
                      handlePhoneChange(e);
                    }} />
                  </FormControl>
                  <FormDescription>
                    Enter the phone number in the format XXX-XXX-XXXX.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
