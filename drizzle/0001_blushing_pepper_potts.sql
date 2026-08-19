CREATE TABLE `contentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kind` enum('question','penalty','tip') NOT NULL,
	`level` enum('hamasat','nabd','aamaq','jawhar'),
	`body` text NOT NULL,
	`summary` text,
	`narrator` varchar(255),
	`source` varchar(500),
	`sourceUrl` varchar(2000),
	`origin` enum('original','suggestion') NOT NULL DEFAULT 'suggestion',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentPublicationLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`suggestionId` int NOT NULL,
	`contentItemId` int NOT NULL,
	`adminUserId` int NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentPublicationLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`kind` enum('question','penalty','tip') NOT NULL,
	`level` enum('hamasat','nabd','aamaq','jawhar'),
	`body` text NOT NULL,
	`summary` text,
	`narrator` varchar(255),
	`source` varchar(500),
	`sourceUrl` varchar(2000),
	`status` enum('pending','rejected','published') NOT NULL DEFAULT 'pending',
	`reviewNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`publishedContentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contentItems` ADD CONSTRAINT `contentItems_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentPublicationLog` ADD CONSTRAINT `contentPublicationLog_suggestionId_contentSuggestions_id_fk` FOREIGN KEY (`suggestionId`) REFERENCES `contentSuggestions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentPublicationLog` ADD CONSTRAINT `contentPublicationLog_contentItemId_contentItems_id_fk` FOREIGN KEY (`contentItemId`) REFERENCES `contentItems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentPublicationLog` ADD CONSTRAINT `contentPublicationLog_adminUserId_users_id_fk` FOREIGN KEY (`adminUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentSuggestions` ADD CONSTRAINT `contentSuggestions_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentSuggestions` ADD CONSTRAINT `contentSuggestions_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentSuggestions` ADD CONSTRAINT `contentSuggestions_publishedContentId_contentItems_id_fk` FOREIGN KEY (`publishedContentId`) REFERENCES `contentItems`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `content_public_idx` ON `contentItems` (`kind`,`isActive`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `content_creator_idx` ON `contentItems` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `publication_suggestion_idx` ON `contentPublicationLog` (`suggestionId`);--> statement-breakpoint
CREATE INDEX `publication_content_idx` ON `contentPublicationLog` (`contentItemId`);--> statement-breakpoint
CREATE INDEX `suggestion_owner_status_idx` ON `contentSuggestions` (`ownerId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `suggestion_review_queue_idx` ON `contentSuggestions` (`status`,`createdAt`);