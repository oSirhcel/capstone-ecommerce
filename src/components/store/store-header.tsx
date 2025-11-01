interface StoreHeaderProps {
  store: {
    name: string;
  };
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-4xl font-bold">{store.name}</h1>
    </div>
  );
}
