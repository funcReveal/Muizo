export const translateRoomErrorDetail = (
  detail: string | null | undefined,
): string => {
  const normalized = (detail ?? "").trim();
  if (!normalized) return detail ?? "";

  const temporaryBanMatch = normalized.match(
    /^You are temporarily banned(?: \((\d+)s\))?$/i,
  );
  if (temporaryBanMatch) {
    const remainingSec = temporaryBanMatch[1];
    return remainingSec
      ? `你目前遭暫時封鎖（剩餘 ${remainingSec} 秒）`
      : "你目前遭暫時封鎖";
  }

  if (
    /^You are permanently banned$/i.test(normalized) ||
    /^You have been permanently banned by the host\.?$/i.test(normalized)
  ) {
    return "你已被房主永久封鎖";
  }

  if (/^You are banned$/i.test(normalized)) {
    return "你目前已被封鎖";
  }

  if (
    /^You have been kicked and banned(?: from this room)?\.?$/i.test(normalized)
  ) {
    return "你已被踢出房間並封鎖";
  }

  if (
    /^You have been removed from the room by the host\.?$/i.test(normalized) ||
    /^You have been removed from this room by the host\.?$/i.test(normalized)
  ) {
    return "你已被房主移出房間";
  }

  if (/^You have been kicked(?: from this room)?\.?$/i.test(normalized)) {
    return "你已被踢出房間";
  }

  return normalized;
};
