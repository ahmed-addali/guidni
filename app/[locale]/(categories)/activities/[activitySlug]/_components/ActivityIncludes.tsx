import { FiCheck, FiX } from "react-icons/fi";

type Props = {
  includes: string[];
  excludes: string[];
  allowed: string[];
  forbidden: string[];
  labels: {
    includes: string;
    excludes: string;
    allowed: string;
    forbidden: string;
  };
};

function ItemList({
  items,
  icon,
  iconClass,
  textClass,
}: {
  items: string[];
  icon: React.ReactNode;
  iconClass: string;
  textClass: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className={`flex items-start gap-2 text-sm ${textClass}`}>
          <span className={`mt-0.5 shrink-0 ${iconClass}`}>{icon}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ActivityIncludes({ includes, excludes, allowed, forbidden, labels }: Props) {
  const hasIncludesBlock = includes.length > 0 || excludes.length > 0;
  const hasRulesBlock = allowed.length > 0 || forbidden.length > 0;

  if (!hasIncludesBlock && !hasRulesBlock) return null;

  return (
    <div className="space-y-8">
      {hasIncludesBlock && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {includes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{labels.includes}</h3>
              <ItemList
                items={includes}
                icon={<FiCheck className="h-4 w-4" />}
                iconClass="text-green-600"
                textClass="text-gray-700"
              />
            </div>
          )}
          {excludes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{labels.excludes}</h3>
              <ItemList
                items={excludes}
                icon={<FiX className="h-4 w-4" />}
                iconClass="text-red-400"
                textClass="text-gray-500"
              />
            </div>
          )}
        </div>
      )}

      {hasIncludesBlock && hasRulesBlock && (
        <div className="border-t border-gray-100" />
      )}

      {hasRulesBlock && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {allowed.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{labels.allowed}</h3>
              <ItemList
                items={allowed}
                icon={<FiCheck className="h-4 w-4" />}
                iconClass="text-blue-500"
                textClass="text-gray-700"
              />
            </div>
          )}
          {forbidden.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{labels.forbidden}</h3>
              <ItemList
                items={forbidden}
                icon={<FiX className="h-4 w-4" />}
                iconClass="text-red-400"
                textClass="text-gray-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
