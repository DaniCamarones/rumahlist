import Image from "next/image";
import { asset } from "@/lib/base-path";
import { iconFor, iconImage } from "@/lib/item-icon";

export function ItemIcon({ name, category, size = "md" }: { name: string; category: string; size?: "sm" | "md" | "lg" }) {
  const src = iconImage(name, category);
  const px = size === "lg" ? 36 : size === "sm" ? 22 : 28;
  return (
    <span aria-hidden
      className={`grid shrink-0 place-items-center leading-none ${
        size === "lg" ? "size-12 text-[28px]" : size === "sm" ? "size-7 text-[18px]" : "size-9 text-[22px]"
      }`}>
      {src ? <Image src={asset(src)} alt="" width={px} height={px} unoptimized /> : iconFor(name, category)}
    </span>
  );
}
