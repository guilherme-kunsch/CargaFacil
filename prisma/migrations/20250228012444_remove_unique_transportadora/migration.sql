-- DropForeignKey
ALTER TABLE `categoria` DROP FOREIGN KEY `Categoria_transportadoraId_fkey`;

-- DropIndex
DROP INDEX `Categoria_transportadoraId_key` ON `categoria`;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
