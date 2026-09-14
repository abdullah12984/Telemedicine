// import { useState } from "react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Camera, Loader2, X } from "lucide-react";
// import { uploadProfileImage, deleteProfileImage } from "../services/authService";
// import { getStoredUser, saveAuthData, } from "../services/authService";
// import { getToken } from "../services/api";
// const ProfileImageUpload = ({ size = "h-24 w-24", fallbackText = "U" }) => {
//   const [uploading, setUploading] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [error, setError] = useState("");
//   const [preview, setPreview] = useState(() => {
//     const user = getStoredUser();
//     return user?.profileImage || null;
//   });

//   const handleImageUpload = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (file.size > 5 * 1024 * 1024) {
//       setError("Image must be less than 5MB");
//       return;
//     }

//     if (!file.type.startsWith("image/")) {
//       setError("Please upload an image file");
//       return;
//     }

//     setUploading(true);
//     setError("");

//     try {
//       const response = await uploadProfileImage(file);
//       if (response.data?.profileImage) {
//         const imageUrl = response.data.profileImage;
//         setPreview(imageUrl);

//         // Update localStorage
//         const user = getStoredUser();
//         const token = getToken();
//         if (user && token) {
//           saveAuthData(token, { ...user, profileImage: imageUrl });
//         }
//         window.dispatchEvent(new Event("userUpdated"));
//       }
//     } catch (err) {
//       setError(err.message || "Upload failed");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!window.confirm("Remove profile picture?")) return;

//     setDeleting(true);
//     try {
//       await deleteProfileImage();
//       setPreview(null);

//       const user = getStoredUser();
//       const token = getToken();
//       if (user && token) {
//         saveAuthData(token, { ...user, profileImage: null });
//       }
//       window.dispatchEvent(new Event("userUpdated"));
//     } catch (err) {
//       setError(err.message || "Delete failed");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const initials = () => {
//     const user = getStoredUser();
//     if (user?.profile) {
//       const f = user.profile.firstName?.charAt(0) || "";
//       const l = user.profile.lastName?.charAt(0) || "";
//       return `${f}${l}` || fallbackText;
//     }
//     return fallbackText;
//   };

//   return (
//     <div className="relative inline-block">
//       <Avatar className={`${size} border-4 border-white shadow-lg`}>
//         <AvatarImage
//           src={preview ? `http://localhost:5000${preview}` : undefined}
//           alt="Profile"
//         />
//         <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
//           {initials()}
//         </AvatarFallback>
//       </Avatar>

//       {/* Upload Button */}
//       <label
//         htmlFor="profile-image-upload"
//         className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-blue-700 transition"
//       >
//         {uploading ? (
//           <Loader2 className="h-4 w-4 text-white animate-spin" />
//         ) : (
//           <Camera className="h-4 w-4 text-white" />
//         )}
//         <input
//           id="profile-image-upload"
//           type="file"
//           accept="image/*"
//           className="hidden"
//           onChange={handleImageUpload}
//           disabled={uploading || deleting}
//         />
//       </label>

//       {/* Delete Button */}
//       {preview && (
//         <button
//           onClick={handleDelete}
//           disabled={deleting}
//           className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 shadow-lg hover:bg-red-600"
//         >
//           {deleting ? (
//             <Loader2 className="h-4 w-4 text-white animate-spin" />
//           ) : (
//             <X className="h-4 w-4 text-white" />
//           )}
//         </button>
//       )}

//       {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//     </div>
//   );
// };

// export default ProfileImageUpload;




import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, X } from "lucide-react";
import { uploadProfileImage, deleteProfileImage, getStoredUser, saveAuthData } from "../services/authService";
import { getToken } from "../services/api";

const ProfileImageUpload = ({ size = "h-24 w-24", fallbackText = "U" }) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(() => {
    const user = getStoredUser();
    return user?.profileImage || null;
  });

  // ✅ NAYA: Listen to userUpdated event (sync between components)
  useEffect(() => {
    const handleUserUpdate = () => {
      const user = getStoredUser();
      setPreview(user?.profileImage || null);
    };

    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const response = await uploadProfileImage(file);
      if (response.data?.profileImage) {
        const imageUrl = response.data.profileImage;

        // Update localStorage
        const user = getStoredUser();
        const token = getToken();
        if (user && token) {
          saveAuthData(token, { ...user, profileImage: imageUrl });
        }

        // Dispatch event — sab jagah update hoga
        window.dispatchEvent(new Event("userUpdated"));
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove profile picture?")) return;

    setDeleting(true);
    try {
      await deleteProfileImage();

      const user = getStoredUser();
      const token = getToken();
      if (user && token) {
        saveAuthData(token, { ...user, profileImage: null });
      }

      // Dispatch event
      window.dispatchEvent(new Event("userUpdated"));
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const initials = () => {
    const user = getStoredUser();
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName.charAt(0)}${user.profile.lastName.charAt(0)}`;
    }
    return fallbackText;
  };

  return (
    <div className="relative inline-block">
      <Avatar className={`${size} border-4 border-white shadow-lg`}>
        <AvatarImage
          src={preview ? `http://localhost:5000${preview}` : undefined}
          alt="Profile"
        />
        <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
          {initials()}
        </AvatarFallback>
      </Avatar>

      {/* Upload Button */}
      <label
        htmlFor={`profile-image-upload-${size}`}
        className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-blue-700 transition"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        ) : (
          <Camera className="h-4 w-4 text-white" />
        )}
        <input
          id={`profile-image-upload-${size}`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={uploading || deleting}
        />
      </label>

      {/* Delete Button */}
      {preview && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 shadow-lg hover:bg-red-600"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          ) : (
            <X className="h-4 w-4 text-white" />
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ProfileImageUpload;