import { useState, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaItem } from "@/data/events";
import {
  Upload,
  Play,
  Image as ImageIcon,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (media: Omit<MediaItem, "id" | "uploadedBy" | "status" | "flags">) => void;
};

export const MediaUploadSheet = ({ open, onOpenChange, onSave }: Props) => {
  const [step, setStep] = useState<"type" | "upload" | "preview">("type");
  const [mediaType, setMediaType] = useState<"video" | "image" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const isVideo = selectedFile.type.startsWith("video/");
    const isImage = selectedFile.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Invalid file type. Please upload a video or image.");
      return;
    }

    // Validate file size (max 100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 100MB.");
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setStep("preview");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSave = async () => {
    if (!file || !preview) return;

    setIsLoading(true);
    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mediaItem: Omit<MediaItem, "id" | "uploadedBy" | "status" | "flags"> =
        {
          kind: file.type.startsWith("video/") ? "video" : "image",
          src: preview,
          poster:
            file.type.startsWith("video/")
              ? preview
              : undefined,
          caption: caption || undefined,
        };

      onSave(mediaItem);
      toast.success(
        `${mediaItem.kind === "video" ? "Video" : "Image"} uploaded. Pending moderation.`
      );

      // Reset
      setStep("type");
      setMediaType(null);
      setFile(null);
      setPreview(null);
      setCaption("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("type");
    setMediaType(null);
    setFile(null);
    setPreview(null);
    setCaption("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-border rounded-t-[28px] p-0"
      >
        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-muted-foreground/40" />

        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-3">
          <h2 className="font-display text-lg font-bold">Upload media</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <div className="px-5 py-8">
          {step === "type" && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/70">
                Choose the type of media you'd like to upload
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setMediaType("video");
                    setStep("upload");
                  }}
                  className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/50 p-6 text-center transition-all hover:bg-muted hover:border-foreground/20"
                >
                  <Play className="h-8 w-8 fill-current" />
                  <span className="font-semibold">Video</span>
                </button>
                <button
                  onClick={() => {
                    setMediaType("image");
                    setStep("upload");
                  }}
                  className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/50 p-6 text-center transition-all hover:bg-muted hover:border-foreground/20"
                >
                  <ImageIcon className="h-8 w-8" />
                  <span className="font-semibold">Image</span>
                </button>
              </div>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/70">
                {mediaType === "video"
                  ? "Select a video file (MP4, WebM, etc.)"
                  : "Select an image file (JPG, PNG, WebP, etc.)"}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center transition-all hover:bg-muted/50 hover:border-foreground/20"
              >
                <Upload className="h-8 w-8 text-foreground/60" />
                <div>
                  <p className="font-semibold">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-foreground/50 mt-1">
                    Max 100MB
                  </p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  mediaType === "video"
                    ? "video/*"
                    : "image/*"
                }
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => setStep("type")}
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                {mediaType === "video" ? (
                  <video
                    src={preview}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Caption (optional)</label>
                <Textarea
                  placeholder="Add a caption for this media..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
