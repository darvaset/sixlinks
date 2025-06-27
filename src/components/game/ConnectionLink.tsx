'use client'

interface ConnectionLinkProps {
  title: string;
  subtitle: string;
}

export function ConnectionLink({ title, subtitle }: ConnectionLinkProps) {
  return (
    <div className="flex flex-col items-center my-2">
      <div className="w-0.5 h-6 bg-gray-200"></div>
      <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
        {subtitle}
      </div>
      <div className="text-sm font-bold mt-1 text-gray-700">{title}</div>
      <div className="w-0.5 h-6 bg-gray-200"></div>
    </div>
  );
}