"use client";

import { useState, useCallback } from "react";
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
}

export function CreateEventModal({
  open,
  onOpenChange,
  onEventCreated,
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
  }>({
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
  });

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
    // Clear location-related errors
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
      const response = await fetch("/api/events", {
        method: "POST",
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
        throw new Error(error.message || "Failed to create event");
      }

      toast.success("Event created successfully!");

      // Reset form
      setFormData({
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
      });
      setErrors({});

      onEventCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
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
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
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
                <SelectItem value="Run">Run</SelectItem>
                <SelectItem value="Yoga">Yoga</SelectItem>
                <SelectItem value="Strength">Strength</SelectItem>
                <SelectItem value="Mobility">Mobility</SelectItem>
                <SelectItem value="HIIT">HIIT</SelectItem>
                <SelectItem value="Recovery">Recovery</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
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
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
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
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
