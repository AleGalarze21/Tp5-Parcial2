ALTER TABLE `invoices` ADD `customer_name` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `customer_document_type` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `customer_document_number` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `customer_address` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `seller_name` text DEFAULT '' NOT NULL;