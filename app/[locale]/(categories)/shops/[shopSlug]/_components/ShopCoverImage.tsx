import Image from "next/image";
import { FaStore } from "react-icons/fa6";

interface Props {
  coverPhoto?: string | null;
  name: string;
}

export function ShopCoverImage({ coverPhoto, name }: Props) {
  return (
    <div className="relative h-64 sm:h-[420px] rounded-2xl overflow-hidden bg-gray-100">
      {coverPhoto ? (
        <Image
          src={coverPhoto}
          alt={name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <FaStore className="h-20 w-20 text-gray-200" />
        </div>
      )}
    </div>
  );
}
