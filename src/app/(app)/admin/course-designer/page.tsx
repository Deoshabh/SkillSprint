// This file's content has been moved to /src/app/(app)/course-designer/page.tsx
// to make the course designer accessible to all authenticated users.
// This path (/admin/course-designer) can be repurposed for admin-specific
// course moderation or management features in the future.

export default function AdminCourseDesignerPlaceholderPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold">Admin Course Management Area</h1>
      <p className="text-muted-foreground">
        This section is reserved for administrative tasks related to course management and moderation.
        The user-facing course designer has been moved to a different location.
      </p>
    </div>
  );
}
