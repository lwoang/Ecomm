# E-Commerce 

## Mô tả dự án
Nền tảng thương mại điện tử đầy đủ tính năng được xây dựng với kiến trúc client-server, hỗ trợ bán hàng trực tuyến với các tính năng như AI chatbot, thanh toán VNPay và quản lý đơn hàng.

## Tính năng chính

### Tính năng cho người dùng
- Đăng ký, kích hoạt tài khoản qua email (mã + link) & đăng nhập.
- Refresh token tự động, bảo mật phiên.
- Cập nhật & xem hồ sơ cá nhân, địa chỉ giao hàng (nhiều địa chỉ, đánh dấu mặc định).
- Tìm kiếm sản phẩm theo từ khóa / danh mục, lọc giá, sắp xếp, phân trang.
- Xem chi tiết sản phẩm.
- Quản lý giỏ hàng: thêm, cập nhật số lượng, xóa item theo biến thể.
- Tạo đơn hàng trực tiếp hoặc từ các item đã chọn trong giỏ.
- Xem lịch sử đơn hàng.
- Thanh toán VNPay.

### Tính năng quản trị
- Quản lý sản phẩm: thêm mới (kèm nhiều ảnh & biến thể), sửa, xóa.
- Quản lý danh mục: tạo, cập nhật, gán cho sản phẩm.
- Quản lý đơn hàng: lọc trạng thái, tìm kiếm (user / mã đơn), phân trang.

## Công nghệ sử dụng

### Frontend (Client)
- React, React Router DOM
- Redux
- TailwindCSS, Ant Design 
- Axios 

### Backend (Server)
- Node.js + Express 
- MongoDB + Mongoose
- JWT Access + Refresh Token 
- Redis
- Multer (upload) + Cloudinary
- Nodemailer (email kích hoạt tài khoản)
- VNPay
- Gemini ChatBot

