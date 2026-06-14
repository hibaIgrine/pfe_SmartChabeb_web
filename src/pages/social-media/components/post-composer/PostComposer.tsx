/**
 * PostComposer.tsx — Éditeur de publication du feed social.
 *
 * RÔLE :
 *   Zone de rédaction d'une nouvelle publication (ou modification d'un post existant).
 *   Affichée en haut du feed et aussi en mode édition inline.
 *
 * FONCTIONNALITÉS :
 *   - Textarea de rédaction avec autocomplétion @mention
 *   - Boutons médias: 📷 Image, 🎬 Vidéo, 📄 Fichier (IconActionButton)
 *   - Hashtag input : saisi + touche Enter → ajouté en badge
 *   - Visibilité: PUBLIC / FRIENDS / PRIVATE / MASKED (avec liste utilisateurs cachés)
 *   - Localisation: champ texte + suggestions SOCIAL_LOCATION_SUGGESTIONS
 *   - Mentions @: dropdown avec autocomplétion sur mentionUsers[]
 *   - Prévisualisation des médias (images) avant envoi
 *   - Bouton "Publier" → publish() depuis useSocialFeed
 *   - Mode édition : pré-rempli via startEditPost() depuis useSocialFeed
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type {
  MentionUser,
  PublicationMediaType,
} from "../../../../api/social-media.api";
import {
  AtSign,
  FileText,
  Hash,
  Image,
  MapPin,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { IconActionButton } from "./IconActionButton";
import {
  CUSTOM_LOCATION_STORAGE_KEY,
  normalizeLocation,
  readCustomLocationSuggestions,
} from "./helpers";
import type { PostComposerProps } from "./types";

export function PostComposer({
  composerText,
  draftMediaItems,
  location,
  visibility,
  mentions,
  hiddenUsers,
  hashtagInput,
  hashtags,
  mentionUsers,
  canSubmit,
  submitting,
  isEditing,
  onSubmit,
  setComposerText,
  setLocation,
  setVisibility,
  setHashtagInput,
  onAddMediaFile,
  onRemoveMediaLine,
  onAddMentionById,
  onRemoveMention,
  onAddHiddenUserById,
  onRemoveHiddenUser,
  onAddHashtag,
  onRemoveHashtag,
  onCancelEdit,
}: PostComposerProps) {
  const [isMentionPopupOpen, setIsMentionPopupOpen] = useState(false);
  const [isLocationPopupOpen, setIsLocationPopupOpen] = useState(false);
  const [isHashtagPopupOpen, setIsHashtagPopupOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [hiddenUsersSearch, setHiddenUsersSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>(() =>
    readCustomLocationSuggestions(),
  );

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const filteredMentionUsers = useMemo(() => {
    const query = mentionSearch.trim().toLowerCase();
    const candidates = mentionUsers.filter(
      (user) => !mentions.some((mention) => mention.id === user.id),
    );

    if (!query) {
      return candidates.slice(0, 12);
    }

    return candidates
      .filter((user) =>
        `${user.nom} ${user.prenom}`.toLowerCase().includes(query),
      )
      .slice(0, 20);
  }, [mentionSearch, mentionUsers, mentions]);

  const filteredLocations = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();
    if (!query) {
      return locationSuggestions.slice(0, 8);
    }

    return locationSuggestions
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 12);
  }, [locationSearch, locationSuggestions]);

  const filteredHiddenUsers = useMemo(() => {
    const query = hiddenUsersSearch.trim().toLowerCase();
    const candidates = mentionUsers.filter(
      (user) => !hiddenUsers.some((hiddenUser) => hiddenUser.id === user.id),
    );

    if (!query) {
      return candidates.slice(0, 12);
    }

    return candidates
      .filter((user) =>
        `${user.nom} ${user.prenom}`.toLowerCase().includes(query),
      )
      .slice(0, 20);
  }, [hiddenUsersSearch, mentionUsers, hiddenUsers]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      CUSTOM_LOCATION_STORAGE_KEY,
      JSON.stringify(locationSuggestions),
    );
  }, [locationSuggestions]);

  const triggerFilePicker = (type: PublicationMediaType) => {
    if (type === "image") imageInputRef.current?.click();
    if (type === "video") videoInputRef.current?.click();
    if (type === "document") documentInputRef.current?.click();
  };

  const handleFilePicked = (
    event: ChangeEvent<HTMLInputElement>,
    type: PublicationMediaType,
  ) => {
    const file = event.target.files?.[0] ?? null;
    onAddMediaFile(type, file);
    event.target.value = "";
  };

  const commitLocation = (value: string) => {
    const nextLocation = normalizeLocation(value);
    if (!nextLocation) {
      return;
    }

    setLocation(nextLocation);
    setLocationSearch(nextLocation);

    setLocationSuggestions((currentSuggestions) => {
      const alreadyExists = currentSuggestions.some(
        (item) => item.toLowerCase() === nextLocation.toLowerCase(),
      );

      if (alreadyExists) {
        return currentSuggestions;
      }

      return [nextLocation, ...currentSuggestions];
    });

    setIsLocationPopupOpen(false);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-[#F7F3E9] border border-[#e7dfcf] rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
          {isEditing ? "Modifier la publication" : "Nouvelle publication"}
        </p>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full border border-[#d8d1c2] px-3 py-1 text-xs font-bold text-[#436D75] hover:bg-[#f7f3e9]"
          >
            Annuler la modification
          </button>
        )}
      </div>

      <textarea
        value={composerText}
        onChange={(event) => setComposerText(event.target.value)}
        placeholder="Quoi de neuf aujourd hui ?"
        rows={4}
        className="w-full rounded-xl border border-[#d8d1c2] bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#436D75]/30"
      />
      <p className="mt-1 text-xs text-gray-500">Ex : post, storie, photo...</p>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e7dfcf] bg-white px-3 py-2">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
          Visibilite
        </p>
        <select
          value={visibility}
          onChange={(event) =>
            setVisibility(event.target.value as "PUBLIC" | "PRIVATE")
          }
          className="rounded-lg border border-[#d8d1c2] px-2.5 py-1.5 text-xs font-bold text-[#436D75] outline-none focus:border-[#436D75]"
        >
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Prive</option>
          <option value="MASKED">Masque</option>
        </select>
      </div>

      {visibility === "MASKED" && (
        <div className="rounded-xl border border-[#e7dfcf] bg-white p-3 space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
            Masquer cette publication pour des personnes
          </p>

          <input
            value={hiddenUsersSearch}
            onChange={(event) => setHiddenUsersSearch(event.target.value)}
            placeholder="Rechercher une personne a masquer"
            className="w-full rounded-lg border border-[#d8d1c2] px-3 py-2 text-sm outline-none focus:border-[#436D75]"
          />

          <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-[#eee8db] p-2">
            {filteredHiddenUsers.length ? (
              filteredHiddenUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onAddHiddenUserById(user.id)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#705a44] hover:bg-[#f9f2e8]"
                >
                  {user.nom} {user.prenom}
                </button>
              ))
            ) : (
              <p className="px-2 py-2 text-xs text-gray-400">Aucun resultat.</p>
            )}
          </div>

          {hiddenUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hiddenUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-2 rounded-full bg-[#fbeeea] px-3 py-1 text-xs font-semibold text-[#9a5e46]"
                >
                  {user.nom} {user.prenom}
                  <button
                    type="button"
                    onClick={() => onRemoveHiddenUser(user.id)}
                    className="rounded-full p-0.5 hover:bg-[#f5ddd6]"
                    aria-label="Retirer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative rounded-2xl border border-[#ddd3c3] bg-white p-3">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-400 mb-3">
          Ajouter a la publication
        </p>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <IconActionButton
            label="Photo"
            icon={<Image size={15} />}
            color="text-[#2d8a46]"
            bg="bg-[#ecf8ef]"
            onClick={() => triggerFilePicker("image")}
          />
          <IconActionButton
            label="Video"
            icon={<Video size={15} />}
            color="text-[#2b6e94]"
            bg="bg-[#edf6fc]"
            onClick={() => triggerFilePicker("video")}
          />
          <IconActionButton
            label="Document"
            icon={<FileText size={15} />}
            color="text-[#7a6332]"
            bg="bg-[#f8f3e7]"
            onClick={() => triggerFilePicker("document")}
          />
          <IconActionButton
            label="Identifier"
            icon={<AtSign size={15} />}
            color="text-[#236f92]"
            bg="bg-[#eaf6fb]"
            onClick={() => {
              setIsMentionPopupOpen((prev) => !prev);
              setIsLocationPopupOpen(false);
              setIsHashtagPopupOpen(false);
            }}
          />
          <IconActionButton
            label="Lieu"
            icon={<MapPin size={15} />}
            color="text-[#9b5f30]"
            bg="bg-[#fdf0e5]"
            onClick={() => {
              setLocationSearch(location);
              setIsLocationPopupOpen((prev) => !prev);
              setIsMentionPopupOpen(false);
              setIsHashtagPopupOpen(false);
            }}
          />
          <IconActionButton
            label="Hashtag"
            icon={<Hash size={15} />}
            color="text-[#6659a6]"
            bg="bg-[#f1eeff]"
            onClick={() => {
              setIsHashtagPopupOpen((prev) => !prev);
              setIsMentionPopupOpen(false);
              setIsLocationPopupOpen(false);
            }}
          />
        </div>

        {isMentionPopupOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsMentionPopupOpen(false)}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[420px] rounded-2xl border border-[#d8e8ef] bg-white shadow-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black uppercase tracking-wide text-[#2f6f8b]">
                  Identifier une personne
                </p>
                <button
                  type="button"
                  onClick={() => setIsMentionPopupOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <input
                value={mentionSearch}
                onChange={(event) => setMentionSearch(event.target.value)}
                placeholder="Rechercher un utilisateur"
                className="w-full rounded-lg border border-[#d5e7ef] px-3 py-2 text-sm"
              />
              <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
                {filteredMentionUsers.length ? (
                  filteredMentionUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        onAddMentionById(user.id);
                        setIsMentionPopupOpen(false);
                      }}
                      className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-[#edf6fb] text-[#2f6f8b] font-medium transition-colors"
                    >
                      {user.nom} {user.prenom}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 px-1 py-2">
                    Aucun utilisateur correspondant.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {isLocationPopupOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsLocationPopupOpen(false)}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[420px] rounded-2xl border border-[#f0ddcc] bg-white shadow-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black uppercase tracking-wide text-[#9b5f30]">
                  Ajouter un lieu
                </p>
                <button
                  type="button"
                  onClick={() => setIsLocationPopupOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <input
                value={locationSearch}
                onChange={(event) => setLocationSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitLocation(locationSearch);
                  }
                }}
                placeholder="Rechercher ou ajouter un lieu"
                className="w-full rounded-lg border border-[#f1dece] px-3 py-2 text-sm"
              />
              <div className="mt-3 max-h-56 overflow-y-auto space-y-1">
                {filteredLocations.length ? (
                  filteredLocations.map((place) => (
                    <button
                      key={place}
                      type="button"
                      onClick={() => commitLocation(place)}
                      className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-[#fff3e8] text-[#8a5d2a] font-medium transition-colors"
                    >
                      {place}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => commitLocation(locationSearch)}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm bg-[#fff3e8] text-[#8a5d2a] font-semibold hover:bg-[#ffe8d6] transition-colors"
                  >
                    Ajouter ce lieu : {locationSearch.trim()}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {isHashtagPopupOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsHashtagPopupOpen(false)}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[400px] rounded-2xl border border-[#ddd8fb] bg-white shadow-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-black uppercase tracking-wide text-[#6659a6]">
                  Ajouter des hashtags
                </p>
                <button
                  type="button"
                  onClick={() => setIsHashtagPopupOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={hashtagInput}
                  onChange={(event) => setHashtagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onAddHashtag();
                      setIsHashtagPopupOpen(false);
                    }
                  }}
                  placeholder="Ex: jeunesse"
                  className="flex-1 rounded-lg border border-[#d7d2fb] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    onAddHashtag();
                    setIsHashtagPopupOpen(false);
                  }}
                  className="rounded-lg bg-[#675aa8] text-white px-4 py-2 text-sm font-bold hover:bg-[#5a4d98] transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFilePicked(event, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => handleFilePicked(event, "video")}
        />
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          className="hidden"
          onChange={(event) => handleFilePicked(event, "document")}
        />
      </div>

      {draftMediaItems.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {draftMediaItems.map((media, index) => (
              <div
                key={`${media.type}-${index}-${media.name}`}
                className="relative rounded-xl border border-[#e4dccf] overflow-hidden bg-gray-100 group"
                style={{ aspectRatio: "1/1" }}
              >
                {media.type === "image" && media.url && (
                  <img
                    src={media.url}
                    alt={media.name || "Photo"}
                    className="w-full h-full object-cover"
                  />
                )}
                {media.type === "video" && media.url && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 relative">
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                        <Video size={24} className="text-gray-800" />
                      </div>
                    </div>
                  </div>
                )}
                {media.type === "document" && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f8f3e7] to-[#f0e8d8] p-2">
                    <FileText size={32} className="text-[#7a6332] mb-1" />
                    <p className="text-xs font-bold text-[#7a6332] text-center truncate px-1">
                      {media.name || "Document"}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveMediaLine(index)}
                  className="absolute top-1 right-1 rounded-lg p-1.5 bg-red-600 text-white hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  title="Retirer media"
                >
                  <Trash2 size={16} />
                </button>
                <p className="absolute bottom-1 left-1 right-1 text-xs font-semibold text-white bg-black/40 px-2 py-1 rounded truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {media.name || "Fichier local"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentions.map((user: MentionUser) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onRemoveMention(user.id)}
              className="rounded-full bg-[#edf6fb] px-2.5 py-1 text-xs font-semibold text-[#2f6f8b]"
            >
              @{user.nom}_{user.prenom} ×
            </button>
          ))}
        </div>
      )}

      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onRemoveHashtag(tag)}
              className="rounded-full bg-[#f4f0ff] px-2.5 py-1 text-xs font-semibold text-[#6457a2]"
            >
              #{tag} ×
            </button>
          ))}
        </div>
      )}

      {location && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f8f1e9] px-3 py-1 text-xs font-semibold text-[#8a5d2a]">
          <MapPin size={14} />
          {location}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium"></span>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-[#E98A7D] px-4 py-2 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#db7465]"
        >
          <Upload size={15} />
          {submitting
            ? isEditing
              ? "Modification en cours..."
              : "Publication en cours..."
            : isEditing
              ? "Modifier"
              : "Publier"}
        </button>
      </div>
    </form>
  );
}
