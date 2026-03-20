"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "cropperjs";

export function ImageCropper({
  dramaId,
  currentPosterUrl,
  onPosterChange,
}: {
  dramaId: string;
  currentPosterUrl: string | null;
  onPosterChange: (url: string | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewThumbRef = useRef<HTMLDivElement>(null);
  const previewMediumRef = useRef<HTMLDivElement>(null);

  // Cache-bust URL for admin display
  const [cacheBust, setCacheBust] = useState(Date.now());
  const adminPosterUrl = currentPosterUrl
    ? `/api${currentPosterUrl}?t=${cacheBust}`
    : null;

  useEffect(() => {
    if (!imageRef.current || !imageSrc) return;

    const previewElements = [
      previewThumbRef.current,
      previewMediumRef.current,
    ].filter(Boolean) as HTMLElement[];

    cropperRef.current = new Cropper(imageRef.current, {
      aspectRatio: 2 / 3,
      viewMode: 1,
      guides: true,
      center: true,
      background: true,
      autoCropArea: 0.9,
      responsive: true,
      rotatable: false,
      scalable: false,
      preview: previewElements,
    });

    return () => {
      cropperRef.current?.destroy();
      cropperRef.current = null;
    };
  }, [imageSrc]);

  const selectFile = useCallback((selected: File) => {
    if (!selected.type.startsWith("image/")) {
      setError("请选择图片文件（JPG、PNG、WebP）");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("文件大小不能超过 10MB");
      return;
    }
    setFile(selected);
    setImageSrc(URL.createObjectURL(selected));
    setError(null);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) selectFile(f);
  };

  const handleConfirm = async () => {
    if (!file || !cropperRef.current) return;

    const data = cropperRef.current.getData(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "cropData",
      JSON.stringify({
        x: Math.round(data.x),
        y: Math.round(data.y),
        width: Math.round(data.width),
        height: Math.round(data.height),
      }),
    );

    setUploading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dramas/${dramaId}/poster`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "上传失败");
        return;
      }

      const json = await res.json();
      onPosterChange(json.poster_url);
      handleCancel();
      setCacheBust(Date.now());
    } catch {
      setError("网络错误，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    cropperRef.current?.destroy();
    cropperRef.current = null;
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setFile(null);
    setImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!window.confirm("确定要删除海报吗？此操作不可撤销。")) return;

    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dramas/${dramaId}/poster`, {
        method: "DELETE",
      });
      if (res.ok) {
        onPosterChange(null);
        setCacheBust(Date.now());
      } else {
        setError("删除失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setUploading(false);
    }
  };

  // --- Crop mode active ---
  if (imageSrc) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-6">
          {/* Cropper area */}
          <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
            <div style={{ maxHeight: 480 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="裁剪预览"
                className="block max-w-full"
              />
            </div>
          </div>

          {/* Live previews */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-xs text-zinc-500">
                缩略图 120×180
              </p>
              <div
                ref={previewThumbRef}
                className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900"
                style={{ width: 80, height: 120 }}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-zinc-500">
                详情图 240×360
              </p>
              <div
                ref={previewMediumRef}
                className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900"
                style={{ width: 120, height: 180 }}
              />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => cropperRef.current?.zoom(0.1)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            放大
          </button>
          <button
            type="button"
            onClick={() => cropperRef.current?.zoom(-0.1)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            缩小
          </button>
          <button
            type="button"
            onClick={() => cropperRef.current?.reset()}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            重置
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={uploading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {uploading ? "处理中…" : "确认裁剪并上传"}
          </button>
        </div>
      </div>
    );
  }

  // --- Default state: show current poster + upload zone ---
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Current poster */}
        {adminPosterUrl && (
          <div className="shrink-0">
            <p className="mb-1.5 text-xs text-zinc-500">当前海报</p>
            <div className="overflow-hidden rounded-lg border border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={adminPosterUrl}
                alt="当前海报"
                className="block object-cover"
                style={{ width: 120, height: 180 }}
              />
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={uploading}
              className="mt-2 w-full rounded-md px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              删除海报
            </button>
          </div>
        )}

        {/* Upload zone */}
        <div className="flex-1">
          <p className="mb-1.5 text-xs text-zinc-500">
            {currentPosterUrl ? "更换海报" : "上传海报"}
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-500/5"
                : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30"
            }`}
          >
            <svg
              className="mb-3 h-8 w-8 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <p className="text-sm text-zinc-400">
              拖拽图片到此处，或点击选择文件
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              支持 JPG、PNG、WebP，最大 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            上传后将裁剪为 2:3 比例，自动生成 120×180、240×360、480×720 三种尺寸
          </p>
        </div>
      </div>
    </div>
  );
}
