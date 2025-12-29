"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationPicker } from "@/components/location-picker";
import { toast } from "sonner";
import type { EventType, EventIntensity } from "@/lib/db/schema";
import { eventSchema } from "@/lib/validations/event";
import { validateFormWithYup } from "@/lib/utils";

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void;
  initialData?: any;
}
const initialEventFormData: {
  title: string;
  location: string;
  locationLat: string;
  locationLng: string;
  city: string;
  date: string;
  time: string;
  duration: string;
  type: EventType | "";
  intensity: EventIntensity | "";
} = {
  title: "",
  location: "",
  locationLat: "",
  locationLng: "",
  city: "",
  date: "",
  time: "",
  duration: "",
  type: "",
  intensity: "",
};

const EVENT_TYPES = [
  { value: "Run" as EventType, label: "Run" },
  { value: "Yoga" as EventType, label: "Yoga" },
  { value: "Strength" as EventType, label: "Strength" },
  { value: "Mobility" as EventType, label: "Mobility" },
  { value: "HIIT" as EventType, label: "HIIT" },
  { value: "Recovery" as EventType, label: "Recovery" },
  { value: "Others" as EventType, label: "Others" },
];

const INTENSITY_LEVELS = [
  { value: "High" as EventIntensity, label: "High" },
  { value: "Medium" as EventIntensity, label: "Medium" },
  { value: "Low" as EventIntensity, label: "Low" },
];

export function CreateEventModal({
  open,
  onOpenChange,
  onEventCreated,
  initialData,
}: CreateEventModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    location: string;
    locationLat: string;
    locationLng: string;
    city: string;
    date: string;
    time: string;
    duration: string;
    type: EventType | "";
    intensity: EventIntensity | "";
  }>(initialEventFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        location: initialData.location || "",
        locationLat: initialData.locationLat || "",
        locationLng: initialData.locationLng || "",
        city: initialData.city || "",
        date: initialData.date || "",
        time: initialData.time || "",
        duration: initialData.duration?.toString() || "",
        type: initialData.type || "",
        intensity: initialData.intensity || "",
      });
    } else {
      setFormData(initialEventFormData);
    }
  }, [initialData, open]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLocationSelect = useCallback((location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      location: location.address,
      city: location.city,
      locationLat: location.lat.toString(),
      locationLng: location.lng.toString(),
    }));

    // remove  location-related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.location;
      delete newErrors.city;
      delete newErrors.locationLat;
      delete newErrors.locationLng;
      return newErrors;
    });
  }, []);

  const validateForm = async () => {
    const { isValid, errors: validationErrors } = await validateFormWithYup(
      eventSchema,
      formData
    );
    setErrors(validationErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setIsLoading(true);

    try {
      const url = initialData ? `/api/events/${initialData.id}` : "/api/events";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          locationLat: formData.locationLat,
          locationLng: formData.locationLng,
          city: formData.city,
          date: formData.date,
          time: formData.time,
          duration: formData.duration ? parseInt(formData.duration) : null,
          type: formData.type,
          intensity: formData.intensity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${initialData ? "update" : "create"} event`);
      }

      toast.success(`Event ${initialData ? "updated" : "created"} successfully!`);

      setFormData(initialEventFormData);
      setErrors({});

      onEventCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${initialData ? "update" : "create"} event`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialEventFormData);
    setErrors({});
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData(initialEventFormData);
      setErrors({});
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target?.closest(".pac-container")) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setErrors({ ...errors, title: "" });
              }}
              maxLength={50}
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Location Picker with Google Maps */}
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={formData.location}
            initialLat={formData.locationLat ? parseFloat(formData.locationLat) : undefined}
            initialLng={formData.locationLng ? parseFloat(formData.locationLng) : undefined}
          />

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              readOnly
              placeholder="Auto-filled from location"
              className="bg-muted"
            />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                setErrors({ ...errors, date: "" });
              }}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => {
                setFormData({ ...formData, time: e.target.value });
                setErrors({ ...errors, time: "" });
              }}
            />
            {errors.time && (
              <p className="text-sm text-red-500">{errors.time}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => {
                setFormData({ ...formData, duration: e.target.value });
                setErrors({ ...errors, duration: "" });
              }}
              placeholder="Enter duration in minutes"
            />
            {errors.duration && (
              <p className="text-sm text-red-500">{errors.duration}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                setFormData({ ...formData, type: value as EventType });
                setErrors({ ...errors, type: "" });
              }}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {/* Intensity */}
          <div className="space-y-2">
            <Label htmlFor="intensity">Intensity</Label>
            <Select
              value={formData.intensity}
              onValueChange={(value) => {
                setFormData({ ...formData, intensity: value as EventIntensity });
                setErrors({ ...errors, intensity: "" });
              }}
            >
              <SelectTrigger id="intensity">
                <SelectValue placeholder="Select intensity level" />
              </SelectTrigger>
              <SelectContent>
                {INTENSITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.intensity && (
              <p className="text-sm text-red-500">{errors.intensity}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
