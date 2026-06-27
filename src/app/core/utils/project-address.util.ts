import { ProjectAddressDto } from '../../api/models/project-address-dto';

export const DEFAULT_MAP_CENTER = { lat: 52.52, lng: 13.405 };

export function buildAddressString(address?: ProjectAddressDto | null): string {
  if (!address) return '';

  return [
    address.street,
    address.houseNumber,
    address.postalCode,
    address.city,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export function hasCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): boolean {
  return latitude != null && longitude != null;
}
