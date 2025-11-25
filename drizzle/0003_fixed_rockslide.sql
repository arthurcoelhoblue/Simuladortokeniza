CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeCompleto` varchar(255) NOT NULL,
	`email` varchar(320),
	`telefone` varchar(20),
	`cidade` varchar(100),
	`estado` varchar(2),
	`cpf` varchar(14),
	`canalOrigem` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `simulations` ADD `leadId` int NOT NULL;