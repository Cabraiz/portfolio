import { HOME_DRIVE_LANDMARKS } from "./homeDrive.constants";
import type { HomeDriveLandmark } from "./homeDrive.types";

export const HOME_DRIVE_FORTALEZA_LANDMARKS: readonly HomeDriveLandmark[] =
  HOME_DRIVE_LANDMARKS;

export function getHomeDriveLandmarks(): readonly HomeDriveLandmark[] {
  return HOME_DRIVE_FORTALEZA_LANDMARKS;
}

export function getHomeDriveLandmarkById(
  id: string,
): HomeDriveLandmark | undefined {
  return HOME_DRIVE_FORTALEZA_LANDMARKS.find((item) => item.id === id);
}

export function getHomeDriveLandmarksByDistrict(
  district: string,
): readonly HomeDriveLandmark[] {
  const normalizedDistrict = district.trim().toLowerCase();

  return HOME_DRIVE_FORTALEZA_LANDMARKS.filter(
    (item) => item.district.trim().toLowerCase() === normalizedDistrict,
  );
}

export function getNearestHomeDriveLandmark(
  traveledMeters: number,
): HomeDriveLandmark | undefined {
  if (!HOME_DRIVE_FORTALEZA_LANDMARKS.length) {
    return undefined;
  }

  return HOME_DRIVE_FORTALEZA_LANDMARKS.reduce<HomeDriveLandmark>(
    (nearest, current) => {
      const nearestDistance = Math.abs(nearest.atMeter - traveledMeters);
      const currentDistance = Math.abs(current.atMeter - traveledMeters);

      return currentDistance < nearestDistance ? current : nearest;
    },
    HOME_DRIVE_FORTALEZA_LANDMARKS[0],
  );
}

export function getUpcomingHomeDriveLandmarks(
  traveledMeters: number,
  limit = 3,
): readonly HomeDriveLandmark[] {
  if (limit <= 0) {
    return [];
  }

  const ahead = HOME_DRIVE_FORTALEZA_LANDMARKS.filter(
    (item) => item.atMeter > traveledMeters,
  );

  return ahead.slice(0, limit);
}

export function getPreviousHomeDriveLandmarks(
  traveledMeters: number,
  limit = 2,
): readonly HomeDriveLandmark[] {
  if (limit <= 0) {
    return [];
  }

  return [...HOME_DRIVE_FORTALEZA_LANDMARKS]
    .filter((item) => item.atMeter <= traveledMeters)
    .reverse()
    .slice(0, limit);
}
