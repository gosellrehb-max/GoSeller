"use client";

import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FiEdit2, FiImage, FiMapPin, FiChevronDown, FiPlus } from "react-icons/fi";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import SellerDashboardShell from "@/features/dashboard/components/SellerDashboardShell";
import type { SellerProfile } from "@/services/api";
import {
  getCurrentSellerProfile,
  updateSellerProfileById,
} from "@/features/dashboard/api/sellerSettings";
import { dashboardQueryKeys } from "@/features/dashboard/queries/queryKeys";
import {
  AREA_OF_DISTRIBUTION_OPTIONS,
  normalizeAreasFromProfile,
  type AreaOfDistributionOption,
} from "@/config/areaOfDistribution";
import { CATEGORIES } from "@/config/categories";

type SettingsForm = {
  businessName: string;
  sellerCategory: string;
  phone: string;
  businessType: string;
  businessLicense: string;
  authorizedTerritories: string;
  areaOfDistribution: AreaOfDistributionOption[];
  city: string;
  state: string;
  zipCode: string;
  country: string;
  storeDescription: string;
  storePickupAddress: string;
};

export default function SellerSettingsView() {
  const searchParams = useSearchParams();
  const isOnboarding = searchParams?.get("onboarding") === "1";

  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null,
  );
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [isSavingSection, setIsSavingSection] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const {
    data: loadedSellerProfile,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: dashboardQueryKeys.seller.settingsProfile,
    queryFn: getCurrentSellerProfile,
  });
  useEffect(() => {
    if (!loadedSellerProfile) return;
    setSellerProfile(loadedSellerProfile);
    setForm({
      businessName: loadedSellerProfile.businessName || "",
      sellerCategory: loadedSellerProfile.sellerCategory || "",
      phone: loadedSellerProfile.phone || "",
      businessType:
        loadedSellerProfile.businessType ||
        loadedSellerProfile.storeCategory ||
        "",
      businessLicense: loadedSellerProfile.businessLicense || "",
      authorizedTerritories: loadedSellerProfile.authorizedTerritories || "",
      areaOfDistribution: normalizeAreasFromProfile(
        loadedSellerProfile.areaOfDistribution,
      ),
      city: loadedSellerProfile.city || "",
      state: loadedSellerProfile.state || "",
      zipCode: loadedSellerProfile.zipCode || "",
      country: loadedSellerProfile.country || "",
      storeDescription: loadedSellerProfile.storeDescription || "",
      storePickupAddress: loadedSellerProfile.storePickupAddress || "",
    });
  }, [loadedSellerProfile]);
  useEffect(() => {
    if (!error) return;
    console.error("Error loading seller settings:", error);
    toast.error("Failed to load seller settings.");
  }, [error]);
  const updateProfileMutation = useMutation({
    mutationFn: updateSellerProfileById,
  });

  const updateField = (field: keyof SettingsForm, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const toggleAreaOfDistribution = (
    opt: AreaOfDistributionOption,
    checked: boolean,
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        areaOfDistribution: checked
          ? Array.from(new Set([...prev.areaOfDistribution, opt]))
          : prev.areaOfDistribution.filter((x) => x !== opt),
      };
    });
  };

  const saveSection = async (section: "store" | "address") => {
    if (!sellerProfile?.id || !form) return;
    if (section === "store" && !form.storePickupAddress.trim()) {
      toast.error(
        "Order pickup address is required so riders can find your store.",
      );
      return;
    }
    if (section === "address" && form.areaOfDistribution.length === 0) {
      toast.error(
        "Select at least one area of distribution (Islamabad and/or Rawalpindi).",
      );
      return;
    }
    setIsSavingSection(section);
    try {
      const payload =
        section === "store"
          ? {
              businessName: form.businessName,
              sellerCategory: "Shopkeeper",
              phone: form.phone,
              businessType: form.businessType,
              businessLicense: form.businessLicense,
              storeCategory: form.businessType,
              sellerStoreCategory: form.businessType,
              authorizedTerritories: form.authorizedTerritories,
              storeDescription: form.storeDescription,
              storePickupAddress: form.storePickupAddress.trim(),
            }
          : {
              areaOfDistribution: form.areaOfDistribution,
              city: form.city,
              state: form.state,
              zipCode: form.zipCode,
              country: form.country,
            };

      await updateProfileMutation.mutateAsync({
        sellerId: sellerProfile.id,
        payload,
      });
      await refetch();
      toast.success("Settings updated successfully.");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings.");
    } finally {
      setIsSavingSection(null);
    }
  };

  const handleAssetUpload = async (
    type: "storeLogo" | "storeBanner",
    file: File,
  ) => {
    if (!sellerProfile?.id) return;
    if (type === "storeLogo") setIsUploadingLogo(true);
    if (type === "storeBanner") setIsUploadingBanner(true);

    try {
      await updateProfileMutation.mutateAsync({
        sellerId: sellerProfile.id,
        payload: { [type]: file },
      });
      await refetch();
      toast.success("Asset updated successfully.");
    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error("Failed to update asset.");
    } finally {
      setIsUploadingLogo(false);
      setIsUploadingBanner(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  if (isLoading || !form) {
    return (
      <SellerDashboardShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </SellerDashboardShell>
    );
  }

  return (
    <SellerDashboardShell>
      <main className="mx-auto flex-1 max-w-7xl px-0 py-2 sm:py-4">
        {isOnboarding && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">Seller account activated!</p>
              <p className="mt-0.5 text-sm text-green-700">
                Complete your store details below — business name, category, and contact info are recommended before you start listing products.
                You can update these anytime from Settings.
              </p>
            </div>
          </div>
        )}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Update your seller store information and uploaded assets.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="mb-1">
                <h2 className="text-xl font-bold text-gray-900">
                  Store details &amp; pickup
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Business profile for your store. The pickup address is shown to
                  riders as <strong>Pickup address</strong> when they accept or
                  deliver your orders.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business Name
                  </label>
                  <input
                    value={form.businessName}
                    onChange={(e) =>
                      updateField("businessName", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Seller Category
                  </label>
                  <input
                    value="Shopkeeper"
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business &amp; store category
                  </label>
                  <div className="relative">
                    <select
                      value={form.businessType}
                      onChange={(e) =>
                        updateField("businessType", e.target.value)
                      }
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-9 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      <option value="">Select a category…</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business License
                  </label>
                  <input
                    value={form.businessLicense}
                    onChange={(e) =>
                      updateField("businessLicense", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Authorized Territories
                  </label>
                  <input
                    value={form.authorizedTerritories}
                    onChange={(e) =>
                      updateField("authorizedTerritories", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Store description
                  </label>
                  <textarea
                    value={form.storeDescription}
                    onChange={(e) =>
                      updateField("storeDescription", e.target.value)
                    }
                    rows={5}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FiMapPin className="w-4 h-4 text-primary" />
                    Order pickup address *
                  </label>
                  <textarea
                    value={form.storePickupAddress}
                    onChange={(e) =>
                      updateField("storePickupAddress", e.target.value)
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    placeholder="Full address and landmarks where riders collect packages"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => saveSection("store")}
                  disabled={isSavingSection === "store"}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingSection === "store" ? (
                    <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <FiPlus className="h-4 w-4" />
                  )}
                  {isSavingSection === "store" ? "Saving…" : "Save changes"}
                </button>
              </div>
            </section>
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="mb-1">
                <h2 className="text-xl font-bold text-gray-900">
                  Business location
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Where your business operates and which areas you deliver to.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-1.5">
                    Area of distribution *{" "}
                    <span className="font-normal text-gray-500">
                      (one or both)
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    {AREA_OF_DISTRIBUTION_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className="inline-flex items-center gap-2 text-sm text-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.areaOfDistribution.includes(opt)}
                          onChange={(e) =>
                            toggleAreaOfDistribution(opt, e.target.checked)
                          }
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City
                  </label>
                  <input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    State / Province
                  </label>
                  <input
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ZIP / Postal Code
                  </label>
                  <input
                    value={form.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Country
                  </label>
                  <input
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => saveSection("address")}
                  disabled={isSavingSection === "address"}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingSection === "address" ? (
                    <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <FiPlus className="h-4 w-4" />
                  )}
                  {isSavingSection === "address" ? "Saving…" : "Save changes"}
                </button>
              </div>
            </section>
          </div>
          <div className="space-y-6">
            <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Store Assets
              </h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FiImage className="w-4 h-4" /> Store Logo
                    </span>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="rounded-full bg-primary p-2 text-white hover:bg-primary/90 transition-colors"
                    >
                      {isUploadingLogo ? (
                        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <FiEdit2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    {sellerProfile?.storeLogoUrl ? (
                      <img
                        src={sellerProfile.storeLogoUrl}
                        alt="Store logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No image</span>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleAssetUpload(
                        "storeLogo",
                        e.target.files?.[0] as File,
                      )
                    }
                  />
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FiImage className="w-4 h-4" /> Store Banner
                    </span>
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="rounded-full bg-primary p-2 text-white hover:bg-primary/90 transition-colors"
                    >
                      {isUploadingBanner ? (
                        <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <FiEdit2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    {sellerProfile?.storeBannerUrl ? (
                      <img
                        src={sellerProfile.storeBannerUrl}
                        alt="Store banner"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No image</span>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleAssetUpload(
                        "storeBanner",
                        e.target.files?.[0] as File,
                      )
                    }
                  />
                </div>
              </div>
            </section>
            <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Current Location Summary
              </h2>
              <div className="flex items-start gap-3 text-sm text-gray-700">
                <FiMapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="break-words">
                    {form.areaOfDistribution.length
                      ? form.areaOfDistribution.join(", ")
                      : "-"}
                  </p>
                  <p className="break-words">
                    {[form.city, form.state, form.zipCode, form.country]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </SellerDashboardShell>
  );
}
