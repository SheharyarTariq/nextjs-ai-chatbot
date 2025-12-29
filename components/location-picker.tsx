"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationPickerProps {
	onLocationSelect: (location: {
		address: string;
		city: string;
		lat: number;
		lng: number;
	}) => void;
	initialLocation?: string;
}

declare global {
	interface Window {
		google: any;
		googleMapsScriptLoading?: boolean;
		googleMapsScriptLoaded?: boolean;
	}
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [scriptLoaded, setScriptLoaded] = useState(false);
	const [error, setError] = useState<string>("");
	const mapInstanceRef = useRef<any>(null);
	const markerRef = useRef<any>(null);
	const onLocationSelectRef = useRef(onLocationSelect);

	// Update ref when callback changes
	useEffect(() => {
		onLocationSelectRef.current = onLocationSelect;
	}, [onLocationSelect]);

	useEffect(() => {
		// script already loaded
		if (window.google && window.google.maps) {
			setScriptLoaded(true);
			return;
		}

		if (window.googleMapsScriptLoading) {
			const checkInterval = setInterval(() => {
				if (window.google && window.google.maps) {
					setScriptLoaded(true);
					clearInterval(checkInterval);
				}
			}, 100);

			return () => clearInterval(checkInterval);
		}

		const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
		if (existingScript) {
			window.googleMapsScriptLoading = true;
			const checkInterval = setInterval(() => {
				if (window.google && window.google.maps) {
					setScriptLoaded(true);
					window.googleMapsScriptLoaded = true;
					clearInterval(checkInterval);
				}
			}, 100);

			return () => clearInterval(checkInterval);
		}

		const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

		if (!apiKey) {
			setError("Google Maps API key not found");
			return;
		}

		window.googleMapsScriptLoading = true;

		const script = document.createElement("script");
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
		script.async = true;
		script.defer = true;
		script.onload = () => {
			setScriptLoaded(true);
			window.googleMapsScriptLoaded = true;
			window.googleMapsScriptLoading = false;
		};
		script.onerror = () => {
			const errorMsg = "Failed to load Google Maps - Check if API key is valid";
			console.error(errorMsg);
			setError(errorMsg);
			window.googleMapsScriptLoading = false;
		};

		document.head.appendChild(script);
	}, []);

	useEffect(() => {
		if (!scriptLoaded || !mapRef.current) return;

		const google = window.google;

		const map = new google.maps.Map(mapRef.current, {
			center: { lat: 25.2048, lng: 55.2708 }, // Dubai as default
			zoom: 12,
		});
		mapInstanceRef.current = map;

		const marker = new google.maps.Marker({
			map: map,
			draggable: true,
		});
		markerRef.current = marker;

		if (searchInputRef.current) {
			const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
			autocomplete.bindTo("bounds", map);

			autocomplete.addListener("place_changed", () => {
				const place = autocomplete.getPlace();

				if (!place.geometry || !place.geometry.location) {
					setError("No location found for this place");
					return;
				}

				const location = place.geometry.location;
				map.setCenter(location);
				map.setZoom(15);
				marker.setPosition(location);

				// Extract city from address components
				let city = "";
				if (place.address_components) {
					for (const component of place.address_components) {
						if (component.types.includes("locality")) {
							city = component.long_name;
							break;
						}
						if (component.types.includes("administrative_area_level_1")) {
							city = city || component.long_name;
						}
					}
				}

				onLocationSelectRef.current({
					address: place.formatted_address || "",
					city: city,
					lat: location.lat(),
					lng: location.lng(),
				});
			});
		}

		// Handle marker drag
		marker.addListener("dragend", () => {
			const position = marker.getPosition();
			const geocoder = new google.maps.Geocoder();

			geocoder.geocode({ location: position }, (results: any, status: any) => {
				if (status === "OK" && results[0]) {
					let city = "";
					for (const component of results[0].address_components) {
						if (component.types.includes("locality")) {
							city = component.long_name;
							break;
						}
						if (component.types.includes("administrative_area_level_1")) {
							city = city || component.long_name;
						}
					}

					onLocationSelectRef.current({
						address: results[0].formatted_address,
						city: city,
						lat: position.lat(),
						lng: position.lng(),
					});
				}
			});
		});

		// Handle map click
		map.addListener("click", (e: any) => {
			const position = e.latLng;
			marker.setPosition(position);

			const geocoder = new google.maps.Geocoder();
			geocoder.geocode({ location: position }, (results: any, status: any) => {
				if (status === "OK" && results[0]) {
					let city = "";
					for (const component of results[0].address_components) {
						if (component.types.includes("locality")) {
							city = component.long_name;
							break;
						}
						if (component.types.includes("administrative_area_level_1")) {
							city = city || component.long_name;
						}
					}

					onLocationSelectRef.current({
						address: results[0].formatted_address,
						city: city,
						lat: position.lat(),
						lng: position.lng(),
					});
				}
			});
		});
	}, [scriptLoaded]);

	if (error) {
		return (
			<div className="space-y-2">
				<Label>Location</Label>
				<div className="text-sm text-red-500">{error}</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Label htmlFor="location-search">Location</Label>
			<Input
				id="location-search"
				ref={searchInputRef}
				type="text"
				placeholder="Search for a location..."
				defaultValue={initialLocation}
				disabled={!scriptLoaded}
			/>
			<div
				ref={mapRef}
				className="w-full h-64 rounded-md border"
				style={{ minHeight: "16rem" }}
			/>
			<p className="text-xs text-muted-foreground">
				Search or click on the map to select a location
			</p>
		</div>
	);
}
