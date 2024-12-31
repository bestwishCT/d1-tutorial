export default {
	async fetch(request, env) {
		const { pathname } = new URL(request.url);
		const urlParts = pathname.split('/').filter(Boolean); // 拆分路径
		const method = request.method;
		const customerId = urlParts[2]; // 获取客户ID

			switch (method) {
				case 'GET':
					// 查询单个客户或所有客户
					if (customerId) {
						return await this.getCustomer(customerId, env);
					}
					return await this.getAllCustomers(env);

				case 'POST':
					// 创建新的客户
					return await this.addCustomer(request, env);

				case 'PUT':
					// 更新客户数据
					if (!customerId) {
						return new Response('Customer ID is required for update', { status: 400 });
					}
					return await this.updateCustomer(customerId, request, env);

				case 'DELETE':
					// 删除客户数据
					if (!customerId) {
						return new Response('Customer ID is required for deletion', { status: 400 });
					}
					return await this.deleteCustomer(customerId, env);

				default:
					return new Response('Method Not Allowed', { status: 405 });
			}
		// 默认响应
		return new Response('Welcome to the API. Use /api/customers to manage customers.', { status: 200 });
	},

	// 获取单个客户信息
	async getCustomer(customerId, env) {
		try {
			const { results } = await env.DB.prepare(
				"SELECT * FROM Customers WHERE id = ?"
			).bind(customerId).all();

			if (results.length > 0) {
				return Response.json(results[0]); // 返回单个客户的结果
			} else {
				return new Response('Customer not found', { status: 404 });
			}
		} catch (err) {
			return new Response('Error fetching customer', { status: 500 });
		}
	},

	async getAllCustomers(env) {
		try {
			const { results } = await env.DB.prepare(
				"SELECT * FROM Customers"
			).all();

			return Response.json(results); // 返回所有客户数据
		} catch (err) {
			return new Response('Error fetching customers', { status: 500 });
		}
	},

	async addCustomer(request, env) {
		try {
			const customerData = await request.json();
			if (!customerData.name || !customerData.company) {
				return new Response('Invalid customer data', { status: 400 });
			}

			const { lastInsertRowId } = await env.DB.prepare(
				"INSERT INTO Customers (CompanyName, ContactName) VALUES (?, ?)"
			).bind(customerData.name, customerData.company).run();

			return new Response(`Customer created with ID: ${lastInsertRowId}`, { status: 201 });
		} catch (err) {
			return new Response('Error adding customer', { status: 500 });
		}
	},

	async updateCustomer(customerId, request, env) {
		try {
			const customerData = await request.json();

			if (!customerData.name && !customerData.company) {
				return new Response('Invalid customer data', { status: 400 });
			}

			const { changes } = await env.DB.prepare(
				"UPDATE Customers SET name = ?, company = ? WHERE id = ?"
			).bind(customerData.name, customerData.company, customerId).run();

			if (changes === 0) {
				return new Response('Customer not found or no changes made', { status: 404 });
			}

			return new Response('Customer updated successfully', { status: 200 });
		} catch (err) {
			return new Response('Error updating customer', { status: 500 });
		}
	},

	// 删除客户信息
	async deleteCustomer(customerId, env) {
		try {
			// 删除客户数据
			const { changes } = await env.DB.prepare(
				"DELETE FROM Customers WHERE id = ?"
			).bind(customerId).run();

			if (changes === 0) {
				return new Response('Customer not found', { status: 404 });
			}

			return new Response('Customer deleted successfully', { status: 200 });
		} catch (err) {
			return new Response('Error deleting customer', { status: 500 });
		}
	}
};
