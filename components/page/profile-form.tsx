"use client";

import { useState } from "react";
import Form from "next/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateProfile } from "../../app/(chat)/profile/actions";
import type { User } from "@/lib/db/schema";
import { Eye, EyeOff } from "lucide-react";
import { profileUpdateSchema } from "@/lib/validations/auth";
import { toast } from "@/components/toast";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    gender: user.gender || "",
    day: user.birthDay?.toString() || "",
    month: user.birthMonth?.toString() || "",
    year: user.birthYear?.toString() || "",
    password: "",
    confirm_password: "",
  });

  const initialFormData = {
    name: user.name || "",
    email: user.email || "",
    gender: user.gender || "",
    day: user.birthDay?.toString() || "",
    month: user.birthMonth?.toString() || "",
    year: user.birthYear?.toString() || "",
    password: "",
    confirm_password: "",
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
  };

  const handleSubmit = async (formDataObj: FormData) => {
    setIsSubmitting(true);
    setErrors({});

    const data = {
      name: formDataObj.get("name") as string,
      email: formDataObj.get("email") as string,
      gender: formDataObj.get("gender") as string,
      day: formDataObj.get("day") as string,
      month: formDataObj.get("month") as string,
      year: formDataObj.get("year") as string,
      password: formDataObj.get("password") as string,
      confirm_password: formDataObj.get("confirm_password") as string,
    };

    try {
      await profileUpdateSchema.validate(data, { abortEarly: false });
      setErrors({});

      const result = await updateProfile(formDataObj);

      if (result.status === "success") {
        toast({
          type: "success",
          description: "Profile updated successfully!",
        });
        setFormData((prev) => ({ ...prev, password: "", confirm_password: "" }));
      } 
    } catch (error: any) {
      const validationErrors: Record<string, string> = {};
      error.inner?.forEach((err: any) => {
        if (err.path) {
          validationErrors[err.path] = err.message;
        }
      });
      setErrors(validationErrors);
      toast({
        type: "error",
        description: "Please fix the validation errorss",
      });
    }

    setIsSubmitting(false);
  };

  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <Form action={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-zinc-600 dark:text-zinc-400"
          htmlFor="name"
        >
          Full Name
        </Label>
        <Input
          className={cn(
            "bg-muted text-md md:text-sm",
            errors.name && "border-red-500"
          )}
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="John Doe"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-zinc-600 dark:text-zinc-400"
          htmlFor="email"
        >
          Email Address
        </Label>
        <Input
          className="bg-muted text-md md:text-sm opacity-60 cursor-not-allowed"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          disabled
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Email address cannot be changed
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-zinc-600 dark:text-zinc-400"
          htmlFor="gender"
        >
          Gender
        </Label>
        <Select
          value={formData.gender}
          onValueChange={(value) => handleSelectChange("gender", value)}
        >
          <SelectTrigger
            className={cn(
              "bg-muted text-md md:text-sm",
              errors.gender && "border-red-500"
            )}
          >
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="gender" value={formData.gender} />
        {errors.gender && (
          <p className="text-red-500 text-sm">{errors.gender}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-normal text-zinc-600 dark:text-zinc-400">
          Date of Birth
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <Select
              value={formData.day}
              onValueChange={(value) => handleSelectChange("day", value)}
            >
              <SelectTrigger
                className={cn(
                  "bg-muted text-md md:text-sm",
                  errors.day && "border-red-500"
                )}
              >
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto ">
                {dayOptions.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="day" value={formData.day} />
            {errors.day && (
              <p className="text-red-500 text-xs">{errors.day}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Select
              value={formData.month}
              onValueChange={(value) => handleSelectChange("month", value)}
            >
              <SelectTrigger
                className={cn(
                  "bg-muted text-md md:text-sm",
                  errors.month && "border-red-500"
                )}
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto ">
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="month" value={formData.month} />
            {errors.month && (
              <p className="text-red-500 text-xs">{errors.month}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Select
              value={formData.year}
              onValueChange={(value) => handleSelectChange("year", value)}
            >
              <SelectTrigger
                className={cn(
                  "bg-muted text-md md:text-sm",
                  errors.year && "border-red-500"
                )}
              >
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="year" value={formData.year} />
            {errors.year && (
              <p className="text-red-500 text-xs">{errors.year}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-zinc-600 dark:text-zinc-400"
          htmlFor="password"
        >
          Password <span className="text-xs text-zinc-500">(Optional)</span>
        </Label>
        <div className="relative">
          <Input
            className={cn(
              "bg-muted text-md md:text-sm pr-10",
              errors.password && "border-red-500"
            )}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Min 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password}</p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Leave blank to keep current password
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-zinc-600 dark:text-zinc-400"
          htmlFor="confirm_password"
        >
          Confirm Password{" "}
          <span className="text-xs text-zinc-500">(Optional)</span>
        </Label>
        <div className="relative">
          <Input
            className={cn(
              "bg-muted text-md md:text-sm pr-10",
              errors.confirm_password && "border-red-500"
            )}
            id="confirm_password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirm_password}
            onChange={handleInputChange}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirm_password && (
          <p className="text-red-500 text-sm">{errors.confirm_password}</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
