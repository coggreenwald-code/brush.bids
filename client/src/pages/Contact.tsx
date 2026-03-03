import { Layout } from "@/components/Layout";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, HelpCircle, Clock, MapPin } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactForm) => {
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24-48 hours.",
    });
    form.reset();
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      description: "support@brushbids.com",
      note: "For general inquiries",
    },
    {
      icon: Clock,
      title: "Response Time",
      description: "24-48 hours",
      note: "Monday - Friday",
    },
    {
      icon: MapPin,
      title: "Location",
      description: "New York, NY",
      note: "Remote-first team",
    },
  ];

  return (
    <Layout>
      <div className="space-y-16 pb-16 max-w-5xl mx-auto">
        <section className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#60A5FA]/10 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-[#A78BFA]" />
          </div>
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Get in Touch</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">Contact Us</h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Have a question or feedback? We'd love to hear from you.
          </p>
        </section>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-6">
            {contactInfo.map((info) => (
              <div key={info.title} className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#60A5FA]/10 flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-5 h-5 text-[#60A5FA]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{info.title}</h3>
                    <p className="text-white/80">{info.description}</p>
                    <p className="text-sm text-white/40">{info.note}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="p-6 rounded-xl bg-[#60A5FA]/5 border border-[#60A5FA]/10">
              <div className="flex items-start gap-4">
                <HelpCircle className="w-5 h-5 text-[#A78BFA] mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Need Quick Help?</h3>
                  <p className="text-sm text-white/50">
                    Check our <a href="/faq" className="text-[#A78BFA] hover:underline" data-testid="link-contact-faq">FAQ page</a> for instant answers to common questions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 p-8 rounded-xl bg-white/[0.02] border border-white/5">
            <h2 className="text-2xl font-display font-bold text-white mb-6">Send a Message</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" data-testid="input-contact-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" data-testid="input-contact-email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Subject</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-contact-subject">
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="artist">Artist Support</SelectItem>
                          <SelectItem value="buyer">Buyer Support</SelectItem>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us how we can help..." 
                          className="min-h-[150px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          data-testid="textarea-contact-message"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full sm:w-auto rounded-full bg-[#A78BFA] text-[#0a0a0f] font-semibold hover:bg-[#A78BFA]/90" data-testid="button-contact-submit">
                  Send Message
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
