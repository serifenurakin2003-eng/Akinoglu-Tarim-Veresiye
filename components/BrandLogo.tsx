import Image from "next/image";

export default function BrandLogo({
  className = "h-14 w-14 sm:h-16 sm:w-16",
}: {
  className?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border-2 border-[#B88E48] bg-[#FAF8F5] shadow-xs ${className}`}
    >
      <Image
        src="/Logo.jpg"
        alt="Akınoğlu Tarım Logo"
        width={120}
        height={120}
        className="h-full w-full object-cover"
        priority
      />
    </div>
  );
}
