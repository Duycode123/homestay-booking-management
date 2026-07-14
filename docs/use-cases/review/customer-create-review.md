# Customer creates a room review

## Business goal

Allow a customer to share a verified experience after completing a stay, including optional real photos.

## Actors

- Customer who owns the booking
- Cloudinary image storage
- Review moderation/admin users

## Preconditions

- The customer is authenticated.
- The booking belongs to the customer and has status `COMPLETED`.
- The booking has not been reviewed before.

## Main flow

1. The customer opens a completed booking.
2. The customer selects a rating from 1 to 5 and writes at least 20 characters.
3. The customer may upload up to four JPG, PNG, or WebP images, each no larger than 5 MB.
4. The backend uploads each image to the configured Cloudinary review folder.
5. The customer submits the review with the returned HTTPS image URLs.
6. The backend validates booking ownership, review eligibility, rating, content, and image URLs.
7. The review and ordered image records are saved in one transaction.
8. Approved reviews appear on the corresponding public room-detail page.

## Alternate and error flows

- A non-completed or foreign booking is rejected.
- A second review for the same booking is rejected by both business validation and a unique database constraint.
- Unsupported, empty, or oversized images are rejected before upload.
- More than four images or non-Cloudinary URLs are rejected.
- If image upload fails, the review form remains open and the customer can retry or remove the failed image.

## Business rules

- One review per booking.
- Rating must be between 1 and 5.
- Review content is required and has a maximum length of 1,000 characters.
- Review images are optional; a review has at most four images.
- Only HTTPS URLs hosted by `res.cloudinary.com` are persisted.
- Public room pages only return approved reviews.

## Related endpoints

- `POST /api/reviews/images`
- `POST /api/reviews`
- `GET /api/reviews/rooms/{roomId}`
- `GET /api/reviews/my`

## Data touched

- `booking`
- `review`
- `review_image`
- `review_response`

## Current implementation notes

- The existing review service remains the application transaction boundary.
- Image upload follows a new review-specific inbound port and Cloudinary outbound adapter.
