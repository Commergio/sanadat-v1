/**
 * Company profile completion (no persistence — used by settings UI).
 */
export function calcCompanyProfileCompletion(data: {
  name?: string;
  cr_number?: string;
  license_number?: string;
  address?: string;
  phone?: string;
  responsible_person?: string;
  logo_url?: string | null;
  signature_url?: string | null;
  stamp_url?: string | null;
}): number {
  const fields = [
    data.name,
    data.cr_number,
    data.license_number,
    data.address,
    data.phone,
    data.responsible_person,
    data.logo_url,
    data.signature_url,
    data.stamp_url,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
