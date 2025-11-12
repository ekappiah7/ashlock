/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('services', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.enu('category', ['installation', 'repair', 'maintenance', 'emergency']).notNullable();
    table.decimal('base_price', 10, 2).notNullable();
    table.integer('estimated_duration').notNullable().comment('Duration in minutes');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.boolean('is_available_for_booking').notNullable().defaultTo(true);
    table.json('requirements');
    table.timestamps(true, true);
    
    table.index(['category']);
    table.index(['is_active']);
    table.index(['is_available_for_booking']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('services');
};