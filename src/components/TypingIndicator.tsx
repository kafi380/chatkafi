export const TypingIndicator = () => {
  return (
    <div className="flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-muted mr-12">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
        </div>
      </div>
    </div>
  );
};
