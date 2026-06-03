export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // pb-16 prevents content from hiding behind the mobile bottom tab bar
  return <div className="pb-16 sm:pb-0">{children}</div>;
}
