ALTER TABLE `simulations` MODIFY COLUMN `amortizacaoMetodo` varchar(20) NOT NULL DEFAULT 'linear';--> statement-breakpoint
ALTER TABLE `simulations` ADD `dataEncerramentoOferta` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `simulations` ADD `modo` varchar(20) DEFAULT 'investidor' NOT NULL;--> statement-breakpoint
ALTER TABLE `simulations` DROP COLUMN `dataInicio`;