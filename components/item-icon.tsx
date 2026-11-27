import Image from "next/image";
import { asset } from "@/lib/base-path";
import { iconFor, iconImage } from "@/lib/item-icon";
import { itemPhoto } from "@/lib/item-photos";

export function ItemIcon({ name, category, size = "md" }: { name: string; category: string; size?: "sm" | "md" | "lg" }) {
  const photo = itemPhoto(name);
  if (photo) {
    const px = size === "lg" ? 56 : size === "sm" ? 28 : 36;
    return (
      <span aria-hidden
        className={`block shrink-0 overflow-hidden rounded-[2px] border border-ink/15 bg-counter ${
          size === "lg" ? "size-14" : size === "sm" ? "size-7" : "size-9"
        }`}>
        <Image src={asset(photo)} alt="" width={px} height={px} unoptimized className="size-full object-cover" />
      </span>
    );
  }
  const src = iconImage(name, category);
  const px = size === "lg" ? 36 : size === "sm" ? 22 : 28;
  return (
    <span aria-hidden
      className={`grid shrink-0 place-items-center leading-none ${
        size === "lg" ? "size-14 text-[28px]" : size === "sm" ? "size-7 text-[18px]" : "size-9 text-[22px]"
      }`}>
      {src ? <Image src={asset(src)} alt="" width={px} height={px} unoptimized /> : iconFor(name, category)}
    </span>
  );
}
