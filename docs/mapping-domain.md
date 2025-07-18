# Mapping Domain

How to map a custom domain to a deployed Cloudrun service.

## Creating a Zone in Cloudflare

1. Access [Cloudflare](https://dash.cloudflare.com/) and create an account.
2. Obtain/purchase a domain.
3. Create a zone.

## Verifying Domain Ownership

<img alt="Select property" width="400" src="./images/mapping-domain/select-property-type.png" />

1. Verify domain ownership in
   [Search Console](https://search.google.com/search-console).

<img src="./images/mapping-domain/added-txt-record.png" alt="Added txt record" width="400" />

2. Copy the specified TxT Record value and register it in Cloudflare's DNS
   records.

3. Return to Search Console, press the verify button, and wait for a moment.

## Configuring the Mapping in Cloudrun

<img src="./images/mapping-domain/cloudrun-setting-screen.png" alt="Setting screen" width="400" />

1. Select the verified domain on Cloudrun's
   [Mapping domain](https://console.cloud.google.com/run/domains) settings page
   to map it.

> [!NOTE]
>
> Leaving the subdomain field blank will map it to the origin.

Finally, a modal like the following image will appear.

<img src="./images/mapping-domain/update-dns-values.png" alt="Added DNS record" width="400" />

<img src="./images/mapping-domain/updated-dns-settings.png" alt="Updated DNS" width="400" />

1. Add the records instructed in the modal to Cloudflare.

<img src="./images/mapping-domain/mapping-status.png" alt="Mapping status" width="400" />

3. Return to the Mapping Domain page of Cloudrun and wait for the status to be
   completed.

Congratulations! A custom domain has been successfully mapped to the Cloudrun
service!
