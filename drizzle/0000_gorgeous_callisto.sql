CREATE TABLE `orders` (
	`order_id` text PRIMARY KEY NOT NULL,
	`submitted_at` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`location` text NOT NULL,
	`delivery_zone` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`price_per_piece` integer NOT NULL,
	`delivery_fee` integer NOT NULL,
	`total_price` integer NOT NULL,
	`payment_method` text NOT NULL,
	`order_status` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`saved_at` text NOT NULL
);
