ALTER TABLE `subjects` ADD `schedule_day` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `schedule_time` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `reminder_minutes` integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE `subjects` ADD `reminder_enabled` integer DEFAULT false;