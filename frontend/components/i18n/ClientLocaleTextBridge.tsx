'use client'

import { useEffect } from 'react'
import type { Locale } from '@/i18n/config'

type TextPair = readonly [vi: string, en: string]

const priorityHomepageTextPairs: TextPair[] = [
  ['GIÁ TRỊ THE SERENE VILLA', 'THE SERENE VILLA VALUES'],
  ['NHỊP SỐNG TẠI THE SERENE VILLA', 'LIFE AT THE SERENE VILLA'],
  ['Mùa xuân tại The Serene Villa', 'Spring at The Serene Villa'],
  ['MÙA XUÂN TẠI THE SERENE VILLA', 'SPRING AT THE SERENE VILLA'],
  ['04 mùa', '4 seasons'],
  ['Chạm vào tấm ảnh phía trước để khám phá mùa tiếp theo.', 'Tap the front photo to discover the next season.'],
  ['Thức dậy trong ánh sáng dịu nhẹ', 'Wake up in soft light'],
  [
    'Bắt đầu ngày mới bằng không khí trong lành, một tách đồ uống ấm và khoảng thời gian không cần vội.',
    'Begin the day with fresh air, a warm drink, and time that does not need to rush.',
  ],
  ['Dành thời gian cho những điều mình thích', 'Make time for what you love'],
  [
    'Đọc sách, nghỉ bên hiên, đi dạo giữa khoảng xanh hoặc đơn giản là tận hưởng sự yên tĩnh.',
    'Read, rest on the porch, wander through greenery, or simply enjoy the quiet.',
  ],
  ['Khép lại một ngày trong sự ấm áp', 'End the day in warmth'],
  [
    'Ánh đèn dịu, căn phòng riêng tư và một nhịp sống chậm giúp bạn thật sự thư giãn trước khi nghỉ ngơi.',
    'Soft lights, a private room, and a slower rhythm help you truly unwind before resting.',
  ],
  ['Riêng tư để thật sự nghỉ ngơi', 'Privacy for real rest'],
  [
    'Không gian đủ tĩnh để bạn ngủ sâu, thư giãn và tận hưởng thời gian theo cách của riêng mình.',
    'A quiet enough space to sleep deeply, relax, and enjoy time in your own way.',
  ],
  ['Gần hơn với những nhịp điệu tự nhiên', 'Closer to natural rhythms'],
  [
    'Ánh sáng, khoảng xanh và không khí dễ chịu hiện diện trong từng buổi sáng và mỗi khoảng nghỉ.',
    'Light, greenery, and gentle air shape every morning and every pause.',
  ],
  ['Chăm sóc vừa đủ, không làm phiền', 'Thoughtful care without intrusion'],
  [
    'Đội ngũ luôn sẵn sàng khi bạn cần và lùi lại khi bạn muốn giữ trọn khoảng riêng.',
    'Our team is ready when needed and steps back when you want privacy.',
  ],
]

const priorityAboutTextPairs: TextPair[] = [
  ['Về The Serene Villa', 'About The Serene Villa'],
  [
    'The Serene Villa được tạo nên với mong muốn mỗi chuyến đi không chỉ là đổi một nơi để ngủ, mà là cơ hội để chậm lại, kết nối và trở về với cảm giác bình yên.',
    'The Serene Villa was created with the hope that every trip is not just a change of place to sleep, but a chance to slow down, reconnect, and return to a sense of calm.',
  ],
  ['The Serene Villa được tạo nên với mong muốn mỗi chuyến đi không chỉ', 'The Serene Villa was created with the hope that every trip is not just'],
  ['là đổi một nơi để ngủ, mà là cơ hội để chậm lại, kết nối và trở về', 'a change of place to sleep, but a chance to slow down, reconnect, and return'],
  ['với cảm giác bình yên.', 'to a sense of calm.'],
  ['The Serene Villa nằm giữa khoảng xanh và khung cảnh núi đồi', 'The Serene Villa set among greenery and mountain scenery'],
  ['Tên gọi & tinh thần thương hiệu', 'Name & brand spirit'],
  ['The Serene Villa — nơi bình yên có hình hài.', 'The Serene Villa — where serenity takes shape.'],
  [
    'gợi lên sự tĩnh tại, trong trẻo và nhẹ nhõm — cảm giác chúng tôi muốn mỗi vị khách tìm thấy ngay từ lúc chọn phòng cho đến khi khép lại kỳ nghỉ.',
    'evokes calm, clarity, and ease — the feeling we want every guest to find from choosing a room to closing their stay.',
  ],
  [
    'không chỉ nói về một không gian lưu trú riêng tư. Với chúng tôi, đó còn là một ngôi nhà được chuẩn bị chu đáo, nơi vẻ đẹp, sự tiện nghi và lòng hiếu khách cùng hiện diện.',
    'means more than a private place to stay. To us, it is a thoughtfully prepared home where beauty, comfort, and hospitality live together.',
  ],
  ['Ghép lại,', 'Together,'],
  [
    'là lời cam kết về một hành trình liền mạch và đáng tin cậy: dễ dàng khi đặt phòng, an tâm khi đến nơi và đủ thư thái để bạn thật sự tận hưởng thời gian của mình.',
    'is a promise of a seamless, reliable journey: simple to book, reassuring on arrival, and calm enough for you to truly enjoy your time.',
  ],
  ['Câu chuyện thương hiệu The Serene Villa', 'The Serene Villa brand story'],
  ['Vị trí ảnh của bạn', 'Your image space'],
  ['Ảnh kể câu chuyện The Serene Villa', 'An image that tells The Serene Villa story'],
  [
    'Khu vực này đã được chừa sẵn để bạn thêm một ảnh về không gian villa, đội ngũ hoặc khoảnh khắc truyền cảm hứng cho tên thương hiệu.',
    'This space is reserved for an image of the villa, the team, or a moment that inspired the brand name.',
  ],
  ['Khuyến nghị 1600 × 1200 px · Tỷ lệ 4:3', 'Recommended 1600 × 1200 px · 4:3 ratio'],
  ['Sứ mệnh của chúng tôi', 'Our mission'],
  [
    'Đưa sự minh bạch của công nghệ vào trải nghiệm lưu trú giàu cảm xúc.',
    'Bringing technological transparency into an emotionally rich stay experience.',
  ],
  [
    'The Serene Villa giúp khách chủ động xem phòng, lịch trống, tiện nghi và giá; đồng thời giúp đội ngũ vận hành chuẩn bị đúng căn phòng, đúng thời điểm.',
    'The Serene Villa helps guests check rooms, availability, amenities, and prices on their own, while helping the operations team prepare the right room at the right time.',
  ],
  [
    'Mục tiêu của chúng tôi là giảm thời gian chờ, hạn chế đặt trùng và giữ trải nghiệm nhất quán từ lúc khám phá đến khi hoàn tất kỳ lưu trú.',
    'Our goal is to reduce waiting time, prevent double bookings, and keep the experience consistent from discovery to the end of the stay.',
  ],
  ['Câu chuyện của chúng tôi', 'Our story'],
  ['Những chuyến đi tạo nên cách chúng tôi đón tiếp.', 'The journeys that shape how we welcome guests.'],
  [
    'Không chỉ xây dựng một nền tảng đặt phòng, chúng tôi còn cùng nhau trải nghiệm, lắng nghe và lưu giữ những khoảnh khắc thật — để hiểu điều gì làm nên một kỳ nghỉ đáng nhớ.',
    'Beyond building a booking platform, we also travel, listen, and keep real moments close — so we understand what makes a stay worth remembering.',
  ],
  ['Một ngày bên suối, nơi ý tưởng về những kỳ nghỉ đẹp bắt đầu', 'A day by the stream, where the idea of beautiful stays began'],
  [
    'Giữa thiên nhiên và những câu chuyện không vội, chúng tôi hiểu rằng một chuyến đi đáng nhớ luôn được tạo nên từ không gian phù hợp và những người đồng hành tuyệt vời.',
    'Surrounded by nature and unhurried conversations, we learned that a memorable trip is shaped by the right space and wonderful companions.',
  ],
  ['Nhóm The Serene Villa cùng nhau trải nghiệm một chuyến đi bên suối', 'The Serene Villa team enjoying a stream-side trip together'],
  ['Dấu chân bình yên', 'Footprints of serenity'],
  ['Giữa núi trời, chúng tôi tìm thấy ý nghĩa của sự an trú', 'Among mountains and sky, we found the meaning of staying in peace'],
  [
    'Một hành trình qua miền núi đã cho chúng tôi khoảng lặng để lắng nghe thiên nhiên và chính mình. Từ khoảnh khắc ấy, The Serene Villa theo đuổi một trải nghiệm lưu trú nơi mỗi khung cửa mở ra cảnh sắc bình yên, còn mỗi vị khách đều có thể chậm lại và tìm thấy sự thư thái theo cách riêng.',
    'A mountain journey gave us a quiet pause to listen to nature and ourselves. From that moment, The Serene Villa began pursuing a stay experience where every window opens to calm scenery, and every guest can slow down and unwind in their own way.',
  ],
  ['Khoảnh khắc giữa núi trời truyền cảm hứng cho câu chuyện The Serene Villa', 'A mountain moment that inspired The Serene Villa story'],
  ['Một hành trình liền mạch', 'A seamless journey'],
  ['Từ lựa chọn đầu tiên đến lúc rời phòng.', 'From the first choice to check-out.'],
  ['Bước 01', 'Step 01'],
  ['Bước 02', 'Step 02'],
  ['Bước 03', 'Step 03'],
  ['Chọn phòng rõ ràng', 'Choose with clarity'],
  ['Xem loại phòng, giá, tiện nghi và lịch trống theo ngày để ra quyết định nhanh hơn.', 'View room types, prices, amenities, and date-based availability to decide faster.'],
  ['Xác nhận minh bạch', 'Transparent confirmation'],
  ['Thanh toán và giữ chỗ được hiển thị theo trạng thái thực tế, giúp bạn biết chính xác bước tiếp theo.', 'Payment and reservation hold status are shown in real time, so you always know the next step.'],
  ['Đến nơi an tâm', 'Arrive with confidence'],
  ['Đội ngũ vận hành có dữ liệu booking để chuẩn bị phòng, tiện nghi và hỗ trợ đúng thời điểm.', 'The operations team uses booking data to prepare the room, amenities, and support at the right time.'],
  ['Trải nghiệm tại The Serene Villa', 'The Serene Villa experience'],
  ['Một kỳ nghỉ được chuẩn bị để bạn chỉ việc tận hưởng.', 'A stay prepared so you only need to enjoy it.'],
  [
    'Từ không gian chung đến từng căn phòng, mọi trải nghiệm đều hướng đến sự riêng tư, thuận tiện và cảm giác được chăm sóc chu đáo.',
    'From shared spaces to each room, every experience is designed around privacy, convenience, and thoughtful care.',
  ],
  ['Không gian chung', 'Shared spaces'],
  ['Sân vườn, góc thư giãn và những khu vực được chuẩn bị để kết nối cùng người thân.', 'Gardens, relaxation corners, and spaces prepared for connecting with loved ones.'],
  ['Tiện nghi chỉn chu', 'Thoughtfully prepared amenities'],
  ['Các hạng phòng được trang bị tiện nghi riêng để đáp ứng nhịp nghỉ ngơi của từng nhóm khách.', 'Room tiers include private amenities that match the resting rhythm of each guest group.'],
  ['Vận hành minh bạch', 'Transparent operations'],
  ['Lịch phòng, trạng thái đặt chỗ và thông tin thanh toán được hiển thị rõ ràng trong từng bước.', 'Room availability, booking status, and payment details are shown clearly at every step.'],
  ['Hỗ trợ khi cần', 'Support when needed'],
  ['Khách có thể chủ động gửi yêu cầu trong hành trình lưu trú để đội ngũ tiếp nhận kịp thời.', 'Guests can send requests during their stay so the team can respond promptly.'],
  ['Khám phá các không gian lưu trú', 'Explore our stays'],
  ['Lưu ý về mô hình:', 'Model note:'],
  [
    'The Serene Villa là mô hình giả lập phục vụ mục tiêu nghiên cứu và phát triển hệ thống quản lý đặt phòng. Thông tin phòng, giá, tiện nghi và quy trình vận hành được xây dựng theo nghiệp vụ thực tế, không đại diện cho một cơ sở lưu trú đang hoạt động.',
    'The Serene Villa is a simulated model for research and development of a booking management system. Room information, prices, amenities, and operating processes are built around realistic business workflows and do not represent an active lodging property.',
  ],
  ['Trải nghiệm The Serene Villa', 'Experience The Serene Villa'],
  ['Không chỉ là một căn phòng. Đó là cảm giác được đón tiếp chu đáo.', 'More than a room. It is the feeling of being thoughtfully welcomed.'],
  ['Khám phá phòng', 'Explore rooms'],
  ['Liên hệ hỗ trợ', 'Contact support'],
  ['Gợi ý cho hành trình của bạn', 'Suggestions for your journey'],
  ['Mỗi chuyến đi đều đẹp hơn khi có thêm vài nơi để ghé qua.', 'Every journey feels richer with a few beautiful places to stop by.'],
  [
    'The Serene Villa được hình dung là điểm dừng chân cho những hành trình muốn đi chậm: một góc cà phê buổi sáng, một cung đường xanh, hoặc bữa tối ấm cúng để mọi câu chuyện được tiếp nối.',
    'The Serene Villa is imagined as a stop for slow journeys: a morning coffee corner, a green road, or a warm dinner where every story can continue.',
  ],
  [
    'The Serene Villa được hình dung là điểm dừng chân cho những hành trình muốn đi chậm: một góc cà phê buổi sáng,',
    'The Serene Villa is imagined as a stop for slow journeys: a morning coffee corner,',
  ],
  ['một cung đường xanh, hoặc bữa tối ấm cúng để mọi câu chuyện được tiếp nối.', 'a green road, or a warm dinner where every story can continue.'],
  [
    'Những lát cắt bên cạnh là các gợi ý được The Serene Villa tuyển chọn: từ điểm hẹn quen thuộc đến những trải nghiệm đáng nhớ quanh hành trình. Mỗi địa điểm đều được ghi chú ngắn gọn để bạn dễ chọn thêm một điểm dừng phù hợp.',
    'The slices beside this text are suggestions curated by The Serene Villa: from familiar meeting points to memorable experiences along the journey. Each place includes a short note so you can choose the next stop with ease.',
  ],
  [
    'Những lát cắt bên cạnh là các gợi ý được The Serene Villa tuyển chọn: từ điểm hẹn quen thuộc đến những trải nghiệm',
    'The slices beside this text are suggestions curated by The Serene Villa: from familiar meeting points to memorable experiences',
  ],
  ['đáng nhớ quanh hành trình. Mỗi địa điểm đều được ghi chú ngắn gọn để bạn dễ chọn thêm một điểm dừng phù hợp.', 'along the journey. Each place includes a short note so you can choose the next stop with ease.'],
  ['Lưu ý:', 'Note:'],
  [
    'Đây là khu vực trình bày nội dung mô phỏng. Hãy thay bằng ảnh và ghi chú do bạn sở hữu hoặc được phép sử dụng trước khi công bố.',
    'This is a demo content area. Replace it with images and notes you own or have permission to use before publishing.',
  ],
  ['Một khoảng rừng tuyết tĩnh lặng, dành cho hành trình tìm về nhịp đi chậm và riêng tư.', 'A quiet snowy forest for journeys that seek a slower, more private rhythm.'],
  ['Một góc làng cổ mộc mạc, gợi cảm giác bình yên cho những ngày muốn tạm rời phố thị.', 'A rustic old-village corner that brings calm to days when you want to step away from the city.'],
]

const textPairs: TextPair[] = [
  ['Trang chủ', 'Home'],
  ['Phòng homestay', 'Rooms'],
  ['Tiện nghi', 'Amenities'],
  ['Về chúng tôi', 'About us'],
  ['Tin tức', 'Journal'],
  ['Hỗ trợ', 'Support'],
  ['Đăng nhập', 'Sign in'],
  ['Đăng ký', 'Register'],
  ['Đăng xuất', 'Sign out'],
  ['Tìm phòng', 'Search rooms'],
  ['Tìm kiếm', 'Search'],
  ['Tìm kiếm văn bản', 'Search text'],
  ['Tên hoặc nhu cầu', 'Name or need'],
  ['Tên phòng, tiện nghi...', 'Room, amenity...'],
  ['Tên phòng hoặc tiện nghi', 'Room name or amenity'],
  ['Nhận phòng', 'Check-in'],
  ['Trả phòng', 'Check-out'],
  ['Khách lưu trú', 'Guests'],
  ['người lớn', 'adults'],
  ['trẻ em', 'children'],
  ['Kiểm tra phòng trống', 'Check availability'],
  ['Xem quy trình lưu trú', 'View stay process'],
  ['Đặt phòng gần đây', 'Recent bookings'],
  ['Cập nhật trực tiếp từ hệ thống', 'Live updates from the system'],
  ['Chưa có lượt đặt phòng mới.', 'No recent bookings yet.'],
  ['Đang hiển thị dữ liệu gần nhất.', 'Showing the latest data.'],
  ['Rõ ràng', 'Clear'],
  ['Linh hoạt', 'Flexible'],
  ['Chu đáo', 'Thoughtful'],
  ['Lịch trống & giá', 'Availability & pricing'],
  ['Khung giờ lưu trú', 'Stay window'],
  ['Hỗ trợ tại chỗ', 'On-site support'],
  ['Boutique Nature Stay', 'Boutique Nature Stay'],
  ['Một kỳ nghỉ vừa vặn với bạn.', 'A stay that fits you beautifully.'],
  ['Không gian riêng tư, tiện nghi được chuẩn bị kỹ và lịch trống minh bạch.', 'Private spaces, carefully prepared amenities, and transparent availability.'],
  ['Chọn căn phòng phù hợp, đặt theo khung giờ linh hoạt và nhận hỗ trợ ngay khi cần.', 'Choose the right room, book with a flexible stay window, and get support when you need it.'],
  ['Đang cập nhật lịch phòng từ backend...', 'Updating room availability from the backend...'],
  ['Đã đóng cửa', 'Closed'],
  ['Mở lại lúc 08:00 ngày mai', 'Reopens tomorrow at 08:00'],

  ['Sắc xuân dịu dàng trong từng khoảng trời.', 'A gentle spring in every quiet corner.'],
  ['Mùa xuân tại The Serene Villa', 'Spring at The Serene Villa'],
  ['Chọn một dấu ấn phản ánh mùa ở The Serene Villa.', 'Choose a seasonal note that reflects The Serene Villa.'],
  ['Khách yêu thích', 'Guest favourites'],
  ['Được khách lưu trú yêu thích bởi sự thoải mái, dịch vụ và nhịp lưu trú thư thái.', 'Handpicked stays loved by guests for comfort, service, and a calmer rhythm.'],
  ['Top-rated rooms', 'Top-rated rooms'],
  ['Phòng được đánh giá cao', 'Top-rated rooms'],
  ['View all', 'View all'],
  ['Xem tất cả', 'View all'],
  ['No room ratings are available yet.', 'No room ratings are available yet.'],
  ['Chưa có đánh giá phòng.', 'No room ratings are available yet.'],
  ['Một khoảng nghỉ đủ riêng để bạn trở về với nhịp của mình.', 'A private pause that lets you return to your own rhythm.'],
  ['The Serene Villa mang đến không gian riêng tư, gần gũi thiên nhiên và được chăm sóc vừa đủ, để mỗi kỳ khách có thể nghỉ ngơi theo cách riêng mà không bị làm phiền.', 'The Serene Villa offers privacy, nature, and thoughtful care so every guest can rest in their own way without being disturbed.'],
  ['Một ngày không cần bắt đầu bằng sự vội vàng.', 'A day that does not need to begin in a rush.'],
  ['Mỗi khoảnh khắc tại The Serene Villa đều được chọn một nhịp nhẹ nhàng hơn — từ buổi sáng trong trẻo đến những phút cuối ngày thật yên tĩnh.', 'Every moment at The Serene Villa follows a gentler pace — from clear mornings to quiet evenings.'],
  ['Những điều nhỏ bé làm nên một kỳ nghỉ dễ chịu.', 'Small details that make a stay feel effortless.'],
  ['Vì sao chọn The Serene Villa', 'Why choose The Serene Villa'],
  ['Riêng tư để thật sự nghỉ ngơi', 'Privacy for real rest'],
  ['Căn hơn với những nhịp điệu tự nhiên', 'Better aligned with natural rhythms'],
  ['Chăm sóc vừa đủ, không làm phiền', 'Thoughtful care without intrusion'],
  ['Xem toàn bộ tiện nghi', 'View all amenities'],

  ['Không gian lưu trú', 'Stay space'],
  ['Tiện ích riêng của phòng', 'Private room amenities'],
  ['Các thiết bị và tiện nghi được bố trí riêng trong phòng này.', 'Facilities arranged specifically for this room.'],
  ['Tiện ích chung của homestay', 'Shared homestay amenities'],
  ['Những không gian chung khách có thể sử dụng trong thời gian lưu trú.', 'Shared spaces guests may use during the stay.'],
  ['Dịch vụ thuê thêm', 'Optional add-on services'],
  ['Có thể chọn khi đặt phòng hoặc gọi nhân viên sau khi check-in.', 'Choose during booking or ask staff after check-in.'],
  ['Có thể hiện tại chưa có dịch vụ thuê thêm phù hợp cho hạng phòng này.', 'There may be no suitable add-on services for this room tier yet.'],
  ['Nội quy chỗ ở', 'House rules'],
  ['Check-in', 'Check-in'],
  ['Check-out', 'Check-out'],
  ['Không cho phép hút thuốc', 'No smoking'],
  ['Không cho phép mang theo thú cưng', 'No pets allowed'],
  ['Cho phép nấu ăn', 'Cooking allowed'],
  ['Cho phép tổ chức tiệc', 'Events allowed'],
  ['Đánh giá của khách hàng', 'Guest reviews'],
  ['Chưa có ai đánh giá phòng này.', 'No guest reviews yet.'],
  ['Chỗ ở tương tự', 'Similar stays'],
  ['Giá tham khảo mỗi đêm', 'Reference price per night'],
  ['Giá cho một đêm', 'Price per night'],
  ['Giá mỗi đêm', 'Nightly price'],
  ['đã gồm trọn 22 giờ lưu trú', 'includes a full 22-hour stay'],
  ['Chọn ngày lưu trú', 'Choose stay dates'],
  ['Chọn ngày khác', 'Choose another date'],
  ['Xem phòng', 'View room'],
  ['Xem chi tiết', 'View details'],
  ['Đặt phòng', 'Book now'],
  ['Đặt ngay', 'Book now'],
  ['Có thể đặt ngay', 'Available to book'],
  ['Còn trống hôm nay', 'Available today'],
  ['Đang giữ chỗ chờ thanh toán', 'Held pending payment'],
  ['Còn lịch cho kỳ lưu trú', 'Available for the selected stay'],
  ['Tối đa', 'Up to'],
  ['Sức chứa', 'Capacity'],
  ['Phòng ngủ', 'Bedrooms'],
  ['Giường ngủ', 'Beds'],
  ['giường', 'beds'],
  ['phòng ngủ', 'bedrooms'],
  ['đêm', 'night'],
  ['Đánh giá', 'Reviews'],

  ['ĐẶT PHÒNG', 'BOOKING'],
  ['Chọn kỳ lưu trú', 'Choose your stay'],
  ['Chọn ngày nhận phòng và trả phòng theo số đêm. Lịch được kiểm tra trực tiếp trước khi tiếp tục.', 'Choose check-in and check-out dates by night. Availability is checked live before continuing.'],
  ['Chọn ngày nhận & trả phòng', 'Choose check-in & check-out'],
  ['Nhận phòng sau 14:00', 'Check-in after 14:00'],
  ['Trả phòng trước 12:00', 'Check-out before 12:00'],
  ['Tiếp tục đặt phòng', 'Continue booking'],
  ['Tiếp tục đến thanh toán', 'Continue to payment'],
  ['Hủy', 'Cancel'],
  ['Tổng tham chiếu', 'Estimated total'],
  ['Ghi chú khách hàng', 'Guest notes'],
  ['Không có ghi chú thêm.', 'No additional notes.'],
  ['Chọn trước để đội ngũ chuẩn bị đúng giờ nhận phòng.', 'Choose ahead so our team can prepare before check-in.'],

  ['Thanh toán bảo mật', 'Secure payment'],
  ['Chọn khoản thanh toán', 'Choose payment amount'],
  ['Bạn muốn thanh toán bao nhiêu?', 'How much would you like to pay?'],
  ['Đặt cọc trước', 'Pay deposit'],
  ['Thanh toán toàn bộ', 'Pay in full'],
  ['Thanh toán đủ', 'Full payment'],
  ['Cọc 50%', '50% deposit'],
  ['Thanh toán hôm nay', 'Pay today'],
  ['Còn lại khi checkout', 'Remaining at checkout'],
  ['Tiền phòng', 'Room charge'],
  ['Tiện nghi thêm', 'Add-on services'],
  ['Mã giảm giá', 'Discount code'],
  ['Tổng giá trị booking', 'Booking total'],
  ['Quét mã để thanh toán', 'Scan to pay'],
  ['Mở ứng dụng ngân hàng và quét mã QR bên dưới.', 'Open your banking app and scan the QR code below.'],
  ['Số tiền', 'Amount'],
  ['Nội dung', 'Transfer note'],
  ['Hiệu lực đến', 'Valid until'],
  ['Thanh toán an toàn', 'Secure payment'],
  ['Tự động xác nhận', 'Auto confirmation'],
  ['Thanh toán thành công', 'Payment successful'],
  ['Thanh toán chưa thành công', 'Payment not completed'],
  ['Đặt cọc thành công', 'Deposit successful'],
  ['Thanh toán đã được hủy', 'Payment cancelled'],
  ['Quay lại chọn phòng', 'Back to rooms'],
  ['Đang chờ ngân hàng xác nhận', 'Waiting for bank confirmation'],
  ['Mã QR đã hết hạn', 'QR code expired'],
  ['Phiên thanh toán đã hết hạn hoặc bị hủy.', 'This payment session has expired or was cancelled.'],
  ['Nếu bạn đã chuyển khoản sau thời hạn, vui lòng liên hệ hỗ trợ để đối soát và hoàn tiền; không chuyển thêm lần nữa.', 'If you transferred after the deadline, please contact support for reconciliation and refund; do not transfer again.'],

  ['Chào mừng trở lại', 'Welcome back'],
  ['Đăng nhập để tiếp tục đặt phòng homestay của bạn.', 'Sign in to continue booking your homestay.'],
  ['Email', 'Email'],
  ['Mật khẩu', 'Password'],
  ['Nhập email của bạn', 'Enter your email'],
  ['Nhập mật khẩu của bạn', 'Enter your password'],
  ['Quên mật khẩu?', 'Forgot password?'],
  ['Đang đăng nhập...', 'Signing in...'],
  ['Hoặc', 'Or'],
  ['Tiếp tục với Google', 'Continue with Google'],
  ['Tiếp tục với Facebook', 'Continue with Facebook'],
  ['Chưa có tài khoản?', 'No account yet?'],
  ['Đăng ký ngay', 'Create an account'],
  ['Tạo tài khoản', 'Create account'],
  ['Họ và tên', 'Full name'],
  ['Số điện thoại', 'Phone number'],
  ['Xác nhận mật khẩu', 'Confirm password'],
  ['Đã có tài khoản?', 'Already have an account?'],
  ['Quên mật khẩu?', 'Forgot password?'],
  ['Khôi phục tài khoản', 'Account recovery'],
  ['Gửi liên kết khôi phục', 'Send recovery link'],
  ['Đặt lại mật khẩu', 'Reset password'],
  ['Mật khẩu mới', 'New password'],
  ['Xác nhận mật khẩu mới', 'Confirm new password'],
  ['Xác thực email', 'Verify email'],
  ['Đang xác thực email', 'Verifying email'],
  ['Đăng nhập ngay', 'Sign in now'],
  ['Một kỳ nghỉ dịu dàng bắt đầu từ đây.', 'A gentle stay begins here.'],
  ['Một nơi ở chỉn chu, ấm áp và đủ riêng tư để bạn thực sự tận hưởng từng khoảnh khắc của chuyến đi.', 'A thoughtful, warm, and private place to truly enjoy every moment of your trip.'],
  ['Đặt phòng liền mạch', 'Seamless booking'],
  ['Không gian được tuyển chọn', 'Curated spaces'],
  ['Đồng hành suốt kỳ nghỉ', 'Support throughout your stay'],

  ['Về The Serene Villa', 'About The Serene Villa'],
  ['Về chúng tôi', 'About us'],
  ['Câu chuyện của chúng tôi', 'Our story'],
  ['Những câu chuyện', 'Stories'],
  ['Khoảnh khắc bên nhau', 'Moments together'],
  ['The Serene Villa được hình dung là điểm dừng chân cho những hành trình muốn đi chậm.', 'The Serene Villa is imagined as a retreat for journeys that want to slow down.'],
  ['Một góc cà phê buổi sáng, một cung đường xanh, hoặc bữa tối ấm cúng để mọi câu chuyện được tiếp nối.', 'A morning coffee corner, a green road, or a warm dinner where every story can continue.'],
  ['The Serene Villa Journal', 'The Serene Villa Journal'],
  ['Địa điểm lân cận', 'Nearby places'],
  ['Khám phá quanh The Serene Villa', 'Explore around The Serene Villa'],
  ['Cần thêm trợ giúp?', 'Need more help?'],
  ['Câu hỏi thường gặp', 'Frequently asked questions'],
  ['Liên hệ hỗ trợ', 'Contact support'],
  ['Tin tức & cảm hứng du lịch', 'Travel news & inspiration'],
  ['Chọn một hành trình để bắt đầu.', 'Choose a journey to begin.'],
  ['Đọc tóm lược', 'Read summary'],
  ['Bài viết mới nhất', 'Latest articles'],

  ['MÙA XUÂN TẠI THE SERENE VILLA', 'SPRING AT THE SERENE VILLA'],
  ['Khách yêu thích', 'Guest favourites'],
  ['Được khách lưu trú yêu thích bởi sự thoải mái, dịch vụ và nhịp lưu trú thư thái.', 'Handpicked stays loved by guests for comfort, service, and a calmer rhythm.'],
  ['Chạm vào tấm ảnh phía trước để khám phá mùa tiếp theo.', 'Tap the front card to discover the next season.'],
  ['Mùi nắng sau mưa, một lối đi dịu dàng.', 'The scent of sun after rain, and a gentler path.'],
  ['Đêm đủ tĩnh để mọi điều chậm lại.', 'A night quiet enough for everything to slow down.'],
  ['Mỗi khoảnh khắc tại The Serene Villa đều được chọn một nhịp nhẹ nhàng hơn.', 'Every moment at The Serene Villa is guided by a gentler rhythm.'],
  ['Đi giữa bình yên, câu chuyện lành bạn muốn.', 'Move through calm, with the story you want.'],
  ['Không gian được chuẩn bị riêng để bạn chỉ cần đến và thả lỏng.', 'A space prepared so you only need to arrive and unwind.'],
  ['Chỉn chu từ đồ thật sự nghỉ ngơi', 'Thoughtful details for real rest'],
  ['Chậm rãi và vừa đủ riêng tư', 'Slow, private, and just enough'],
  ['Điểm đến yên tĩnh', 'Quiet destination'],

  ['Hạng phòng', 'Room tier'],
  ['Loại phòng', 'Room type'],
  ['Số phòng ngủ', 'Bedrooms'],
  ['Số giường', 'Beds'],
  ['Số khách tối đa', 'Max guests'],
  ['Lưu trú tối thiểu', 'Minimum stay'],
  ['Tiện nghi nổi bật', 'Featured amenities'],
  ['Không có ảnh minh họa', 'No preview image'],
  ['Chưa có đánh giá', 'No reviews yet'],
  ['Đã lưu trú', 'Stayed here'],
  ['Chưa có ai đánh giá', 'No reviews yet'],
  ['Tương tự cùng hạng phòng', 'Similar stays in this tier'],
  ['Dành cho bạn', 'Recommended for you'],

  ['LỊCH LƯU TRÚ', 'STAY DATES'],
  ['Ngày nhận phòng', 'Check-in date'],
  ['Ngày trả phòng', 'Check-out date'],
  ['Khung giờ', 'Time window'],
  ['Thời lượng', 'Duration'],
  ['Địa điểm', 'Location'],
  ['Đã xác nhận', 'Confirmed'],
  ['Kiểm tra lại trước khi thanh toán', 'Review before payment'],
  ['Chưa tạo booking và chưa giữ phòng ở bước này', 'No booking or room hold is created at this step'],
  ['Phòng được giữ trong thời gian thanh toán.', 'The room is held during payment.'],

  ['Thanh toán online', 'Online payment'],
  ['Thanh toán tiền mặt', 'Cash payment'],
  ['Chuyển khoản ngân hàng', 'Bank transfer'],
  ['Đang giữ phòng', 'Holding room'],
  ['Đang chờ ngân hàng xác nhận', 'Waiting for bank confirmation'],
  ['Đang kiểm tra trạng thái thanh toán', 'Checking payment status'],
  ['Tạo lại mã QR', 'Regenerate QR code'],
  ['Chọn lại kỳ lưu trú', 'Choose stay again'],
  ['Thanh toán thất bại', 'Payment failed'],
  ['Thanh toán đã hết hạn', 'Payment expired'],
  ['Vui lòng giữ nguyên số tiền và nội dung.', 'Please keep the exact amount and transfer note.'],
  ['Trang sẽ tự chuyển khi giao dịch được xác nhận.', 'The page will continue automatically once the transaction is confirmed.'],

  ['BẢO MẬT TÀI KHOẢN', 'ACCOUNT SECURITY'],
  ['Vui lòng chờ trong giây lát trong khi chúng tôi kiểm tra tính hợp lệ của liên kết.', 'Please wait while we verify the link.'],
  ['Dịch vụ email tạm thời không khả dụng. Vui lòng thử lại sau.', 'Email service is temporarily unavailable. Please try again later.'],
  ['Hệ thống đã gửi liên kết đặt lại mật khẩu vào email của bạn.', 'We have sent a password reset link to your email.'],
  ['Đăng nhập thất bại, vui lòng kiểm tra lại tài khoản.', 'Sign-in failed. Please check your account.'],
  ['Quá nhiều yêu cầu. Vui lòng thử lại sau.', 'Too many requests. Please try again later.'],

  ['Làm thế nào để đặt phòng?', 'How do I make a reservation?'],
  ['Làm sao biết thanh toán đã thành công?', 'How do I know the payment succeeded?'],
  ['Tôi có thể thanh toán bằng những hình thức nào?', 'Which payment methods are available?'],
  ['Tôi có thể thay đổi hoặc hủy lịch không?', 'Can I change or cancel my stay?'],
  ['Tôi cần hỗ trợ trong thời gian lưu trú thì làm gì?', 'What should I do if I need help during my stay?'],
  ['Tôi quên mật khẩu hoặc không xác thực được email?', 'What if I forgot my password or cannot verify email?'],
  ['Gửi yêu cầu hỗ trợ', 'Send support request'],
  ['Báo cáo sự cố', 'Report an issue'],
  ['Hotline', 'Hotline'],
  ['Trò chuyện với HomeBot', 'Chat with HomeBot'],
  ['Cần tư vấn?', 'Need advice?'],
]

const customerPageTextPairs: TextPair[] = [
  ['MÙA XUÂN TẠI THE SERENE VILLA', 'SPRING AT THE SERENE VILLA'],
  ['Sắc xuân dịu dàng trong từng khoảng trời.', 'A gentle spring in every quiet corner.'],
  ['Mùa xuân tại The Serene Villa hé lộ bên trong sắc hoa hồng nhẹ, những tán cây vừa thay lá và ánh sáng trong trẻo đầu ngày.', 'Spring at The Serene Villa unfolds through soft blooms, fresh greenery, and clear morning light.'],
  ['Đến đây, những điều giản dị của thiên nhiên, nắng chạm vào khung gian tươi mới, thanh lịch và đầy cảm hứng cho những khởi đầu bình yên.', 'Here, simple moments of nature, sunlight, and calm spaces create an elegant beginning for a peaceful escape.'],
  ['Khách yêu thích', 'Guest favourites'],
  ['Phòng được đánh giá cao', 'Top-rated rooms'],
  ['Không có phòng được đánh giá nào.', 'No room ratings are available yet.'],
  ['Một khoảng nghỉ đủ riêng để bạn trở về với nhịp của mình.', 'A private pause that lets you return to your own rhythm.'],
  ['The Serene Villa mang đến không gian yên tĩnh, gần gũi với thiên nhiên và được chăm sóc vừa đủ, để mỗi vị khách có thể nghỉ ngơi theo cách riêng mà không bị làm phiền.', 'The Serene Villa offers quiet, nature-led spaces with thoughtful care, so every guest can rest in their own rhythm.'],
  ['Chọn nơi thật sự nghỉ ngơi', 'Choose a place made for rest'],
  ['Căn hơn với những nhịp điệu tự nhiên', 'Spaces tuned to a calmer rhythm'],
  ['Chăm sóc vừa đủ, không làm phiền', 'Thoughtful care without intrusion'],
  ['Một ngày không cần bắt đầu bằng sự vội vàng.', 'A day that does not need to begin in a rush.'],
  ['Vì sao chọn The Serene Villa', 'Why choose The Serene Villa'],
  ['Không gian lưu trú', 'Stay space'],
  ['Không gian lưu trú dành cho 1-2 khách, được trang bị giường đôi, điều hòa inverter, Smart TV và Wi-Fi tốc độ cao.', 'A stay space for 1-2 guests with a double bed, inverter AC, Smart TV, and high-speed Wi-Fi.'],
  ['Hạng phòng', 'Room tier'],
  ['Sức chứa', 'Capacity'],
  ['Phòng ngủ', 'Bedrooms'],
  ['Giường ngủ', 'Beds'],
  ['Lưu trú tối thiểu', 'Minimum stay'],
  ['Giá tham khảo mỗi đêm', 'Reference nightly price'],
  ['Giá cho một đêm', 'Price per night'],
  ['đêm', 'night'],
  ['Tiện ích riêng của phòng', 'Private room amenities'],
  ['Các thiết bị và tiện nghi được bố trí riêng trong phòng này.', 'Devices and amenities prepared specifically for this room.'],
  ['Tiện ích chung của homestay', 'Shared homestay amenities'],
  ['Không gian và tiện ích chung dành cho khách lưu trú trong cùng khu.', 'Shared spaces and amenities for guests staying in the same villa area.'],
  ['Dịch vụ thuê thêm', 'Optional add-on services'],
  ['Có thể chọn khi đặt phòng hoặc yêu cầu sau khi check-in. Chi phí chỉ được cộng theo số lượng thực tế.', 'Choose while booking or request after check-in. Charges are added only by actual quantity.'],
  ['Nội quy chỗ ở', 'House rules'],
  ['Đánh giá của khách hàng', 'Guest reviews'],
  ['Chưa có ai đánh giá phòng này.', 'No guest reviews yet.'],
  ['Chỗ ở tương tự', 'Similar stays'],
  ['Chưa tạo booking và chưa giữ phòng ở bước này', 'No booking is created and no room is held at this step'],
  ['Giá tham khảo', 'Reference price'],
  ['Thời lượng', 'Duration'],
  ['Tiền phòng', 'Room charge'],
  ['Tổng tham chiếu', 'Estimated total'],
  ['Ghi chú khách hàng', 'Guest notes'],
  ['Không có ghi chú thêm.', 'No additional notes.'],
  ['Tiếp tục đến thanh toán', 'Continue to payment'],
  ['Quay lại chọn phòng', 'Back to rooms'],
  ['ĐẶT PHÒNG', 'BOOKING'],
  ['Chọn kỳ lưu trú', 'Choose your stay'],
  ['Chọn ngày nhận phòng và trả phòng theo số đêm. Lịch được kiểm tra trực tiếp trước khi tiếp tục.', 'Choose check-in and check-out dates by night. Availability is checked live before you continue.'],
  ['LỊCH LƯU TRÚ', 'STAY DATES'],
  ['Chọn ngày nhận & trả phòng', 'Choose check-in and check-out'],
  ['Nhận phòng sau 14:00', 'Check-in after 14:00'],
  ['Trả phòng trước 12:00', 'Check-out before 12:00'],
  ['NGÀY NHẬN PHÒNG', 'CHECK-IN DATE'],
  ['NGÀY TRẢ PHÒNG', 'CHECK-OUT DATE'],
  ['Tiếp tục đặt phòng', 'Continue booking'],
  ['BẢO MẬT TÀI KHOẢN', 'ACCOUNT SECURITY'],
  ['Chào mừng trở lại', 'Welcome back'],
  ['Đăng nhập để tiếp tục đặt phòng homestay của bạn.', 'Sign in to continue booking your homestay.'],
  ['Nhập email của bạn', 'Enter your email'],
  ['Nhập mật khẩu của bạn', 'Enter your password'],
  ['Mật khẩu', 'Password'],
  ['Quên mật khẩu?', 'Forgot password?'],
  ['HOẶC', 'OR'],
  ['Tiếp tục với Google', 'Continue with Google'],
  ['Tiếp tục với Facebook', 'Continue with Facebook'],
  ['Chưa có tài khoản?', 'No account yet?'],
  ['Đăng ký ngay', 'Create an account'],
  ['Tạo tài khoản', 'Create account'],
  ['Họ và tên', 'Full name'],
  ['Số điện thoại', 'Phone number'],
  ['Xác nhận mật khẩu', 'Confirm password'],
  ['Đã có tài khoản?', 'Already have an account?'],
  ['Khôi phục tài khoản', 'Account recovery'],
  ['Quên mật khẩu?', 'Forgot password?'],
  ['Nhập email đã đăng ký. Chúng tôi sẽ gửi cho bạn một liên kết an toàn để thiết lập mật khẩu mới.', 'Enter your registered email. We will send a secure link to set a new password.'],
  ['Gửi liên kết khôi phục', 'Send recovery link'],
  ['Đặt lại mật khẩu', 'Reset password'],
  ['Mật khẩu mới', 'New password'],
  ['Xác nhận mật khẩu mới', 'Confirm new password'],
  ['Đang xác thực email', 'Verifying email'],
  ['Vui lòng chờ trong giây lát trong khi chúng tôi kiểm tra tính hợp lệ của liên kết.', 'Please wait while we check whether this link is valid.'],
  ['Dịch vụ email tạm thời không khả dụng. Vui lòng thử lại sau.', 'Email service is temporarily unavailable. Please try again later.'],
  ['Đăng nhập thất bại, vui lòng kiểm tra lại tài khoản.', 'Sign-in failed. Please check your account.'],
  ['Quá nhiều yêu cầu. Vui lòng thử lại sau.', 'Too many requests. Please try again later.'],
  ['Thanh toán bảo mật', 'Secure payment'],
  ['Chọn khoản thanh toán', 'Choose payment amount'],
  ['Bạn muốn thanh toán bao nhiêu?', 'How much would you like to pay?'],
  ['Đặt cọc trước', 'Pay deposit'],
  ['Thanh toán toàn bộ', 'Pay in full'],
  ['Thanh toán đủ', 'Full payment'],
  ['Cọc 50%', '50% deposit'],
  ['Thanh toán hôm nay', 'Pay today'],
  ['Còn lại khi checkout', 'Remaining at checkout'],
  ['Tiện nghi thêm', 'Add-on services'],
  ['Mã giảm giá', 'Discount code'],
  ['Tổng giá trị booking', 'Booking total'],
  ['Quét mã để thanh toán', 'Scan to pay'],
  ['Mở ứng dụng ngân hàng và quét mã QR bên dưới.', 'Open your banking app and scan the QR code below.'],
  ['Số tiền', 'Amount'],
  ['Nội dung', 'Transfer note'],
  ['Hiệu lực đến', 'Valid until'],
  ['Vui lòng giữ nguyên số tiền và nội dung. Trang sẽ tự chuyển khi giao dịch được xác nhận.', 'Please keep the exact amount and transfer note. The page will continue automatically when payment is confirmed.'],
  ['Thanh toán an toàn', 'Secure payment'],
  ['Tự động xác nhận', 'Auto confirmation'],
  ['Thanh toán thành công', 'Payment successful'],
  ['Thanh toán thất bại', 'Payment failed'],
  ['Thanh toán đã hết hạn', 'Payment expired'],
  ['Mã QR đã hết hạn', 'QR code expired'],
  ['Về The Serene Villa', 'About The Serene Villa'],
  ['Câu chuyện của chúng tôi', 'Our story'],
  ['Những câu chuyện', 'Stories'],
  ['Khoảnh khắc bên nhau', 'Moments together'],
  ['Địa điểm lân cận', 'Nearby places'],
  ['Khám phá quanh The Serene Villa', 'Explore around The Serene Villa'],
  ['Tin tức & cảm hứng du lịch', 'Travel news & inspiration'],
  ['Chọn một hành trình để bắt đầu.', 'Choose a journey to begin.'],
  ['Đọc tóm lược', 'Read summary'],
  ['Bài viết mới nhất', 'Latest articles'],
  ['Cần thêm trợ giúp?', 'Need more help?'],
  ['Câu hỏi thường gặp', 'Frequently asked questions'],
  ['Liên hệ hỗ trợ', 'Contact support'],
]

const supplementalTextPairs: TextPair[] = [
  ['Mùa xuân', 'Spring'],
  ['Mùa hạ', 'Summer'],
  ['Mùa thu', 'Autumn'],
  ['Mùa đông', 'Winter'],
  ['Xuân', 'Spring'],
  ['Hạ', 'Summer'],
  ['Thu', 'Autumn'],
  ['Đông', 'Winter'],
  ['04 mùa', '4 seasons'],
  ['Chạm vào tấm ảnh phía trước để khám phá mùa tiếp theo.', 'Tap the front photo to discover the next season.'],
  ['Mùa hạ tại The Serene Villa', 'Summer at The Serene Villa'],
  ['Mùa thu tại The Serene Villa', 'Autumn at The Serene Villa'],
  ['Mùa đông tại The Serene Villa', 'Winter at The Serene Villa'],
  ['Những ngày dài khép lại bên ánh hoàng hôn.', 'Long days closing beside the sunset.'],
  ['Khi khu rừng khoác lên mình sắc màu ấm áp.', 'When the forest dresses itself in warm colours.'],
  ['Bình yên hiện hữu giữa miền tuyết trắng.', 'Peace held within a quiet white landscape.'],
  [
    'Mùa xuân tại The Serene Villa hiện lên trong sắc hoa hồng nhẹ, những tán cây vừa thay lá và ánh sáng trong trẻo đầu ngày. Đèn lồng khẽ đung đưa giữa khuôn viên, mang đến một không gian tươi mới, thanh lịch và đầy cảm hứng cho những khởi đầu bình yên.',
    'Spring at The Serene Villa appears through soft pink blooms, fresh leaves, and clear morning light. Lanterns sway gently across the grounds, creating a fresh, elegant space for peaceful beginnings.',
  ],
  [
    'Mùa hạ tại The Serene Villa là những buổi chiều ngập nắng, lối đá dẫn xuống mặt nước và sắc hoa rực rỡ trong ánh hoàng hôn. Đây là lúc bạn có thể tạm rời nhịp sống vội vàng, tận hưởng làn gió dịu và lưu lại những khoảnh khắc thật chậm bên thiên nhiên.',
    'Summer at The Serene Villa is made of sunlit afternoons, stone paths leading toward the water, and vibrant flowers glowing at dusk. It is a time to step away from the rush, enjoy the soft breeze, and keep slow moments close to nature.',
  ],
  [
    'Mùa thu phủ quanh The Serene Villa những gam đỏ, cam và vàng trầm ấm. Căn villa nép mình dưới tán cây, bên mặt hồ phủ lá, tạo nên một không gian yên tĩnh dành cho những buổi đọc sách, thưởng trà và lắng nghe thiên nhiên chuyển mùa.',
    'Autumn wraps The Serene Villa in deep reds, oranges, and warm golds. The villa rests beneath the trees beside a leaf-covered lake, creating a quiet space for reading, tea, and listening to the season change.',
  ],
  [
    'Mùa đông tại The Serene Villa mở ra với lối đi phủ tuyết, những hàng cây trắng xóa và ánh nắng dịu trải dài trên khu nghỉ dưỡng. Bên ngoài là không khí lạnh trong trẻo, còn bên trong luôn là một không gian ấm áp, riêng tư để bạn nghỉ ngơi và tái tạo năng lượng.',
    'Winter at The Serene Villa opens with snow-covered paths, white tree lines, and soft sunlight across the retreat. Outside is crisp winter air; inside is a warm, private space to rest and renew.',
  ],

  ['Nhịp sống tại The Serene Villa', 'Life at The Serene Villa'],
  ['Một ngày không cần bắt đầu bằng sự vội vàng.', 'A day that does not need to begin in a rush.'],
  ['Mỗi khoảng thời gian tại The Serene Villa đều dành cho một nhịp nghỉ', 'Every moment at The Serene Villa is made for a gentler rhythm'],
  ['nhẹ nhàng hơn — từ buổi sáng trong trẻo đến những phút cuối ngày', 'from clear mornings to the quiet final minutes of the day'],
  ['thật yên tĩnh.', 'in complete calm.'],
  ['Buổi sáng', 'Morning'],
  ['Buổi chiều', 'Afternoon'],
  ['Buổi tối', 'Evening'],
  ['Thức dậy trong ánh sáng dịu nhẹ', 'Wake up in soft light'],
  ['Dành thời gian cho những điều mình thích', 'Make time for what you love'],
  ['Khép lại một ngày trong sự ấm áp', 'End the day in warmth'],
  [
    'Bắt đầu ngày mới bằng không khí trong lành, một tách đồ uống ấm và khoảng thời gian không cần vội.',
    'Begin the day with fresh air, a warm drink, and time that does not need to hurry.',
  ],
  [
    'Đọc sách, nghỉ bên hiên, đi dạo giữa khoảng xanh hoặc đơn giản là tận hưởng sự yên tĩnh.',
    'Read, rest on the veranda, walk through the greenery, or simply enjoy the quiet.',
  ],
  [
    'Ánh đèn dịu, căn phòng riêng tư và một nhịp sống chậm giúp bạn thật sự thư giãn trước khi nghỉ ngơi.',
    'Soft lighting, a private room, and a slower rhythm help you truly unwind before resting.',
  ],

  ['Giá trị The Serene Villa', 'The Serene Villa values'],
  ['Một khoảng nghỉ', 'A retreat'],
  ['đủ riêng', 'private enough'],
  ['để bạn trở về với nhịp của mình.', 'for you to return to your own rhythm.'],
  ['Đủ gần khi bạn cần,', 'Close enough when you need us,'],
  ['đủ riêng khi bạn muốn.', 'private enough when you want space.'],
  [
    'The Serene Villa mang đến không gian yên tĩnh, gần gũi với thiên nhiên và được chăm sóc vừa đủ, để mỗi vị khách có thể nghỉ ngơi theo cách riêng mà không bị làm phiền.',
    'The Serene Villa offers a quiet, nature-connected stay with just the right level of care, so every guest can rest in their own way without being disturbed.',
  ],
  [
    'Một cách đón tiếp tôn trọng sự riêng tư và nhịp nghỉ của từng vị khách.',
    'A way of hosting that respects each guest’s privacy and pace of rest.',
  ],
  ['Khám phá trải nghiệm', 'Explore the experience'],
  ['01 · Không gian', '01 · Space'],
  ['02 · Thiên nhiên', '02 · Nature'],
  ['03 · Đồng hành', '03 · Care'],
  ['Riêng tư để thật sự nghỉ ngơi', 'Private enough to truly rest'],
  ['Gần hơn với những nhịp điệu tự nhiên', 'Closer to natural rhythms'],
  ['Chăm sóc vừa đủ, không làm phiền', 'Thoughtful care without interruption'],
  [
    'Không gian đủ tĩnh để bạn ngủ sâu, thư giãn và tận hưởng thời gian theo cách của riêng mình.',
    'A space quiet enough for deep sleep, slow rest, and time enjoyed your own way.',
  ],
  [
    'Ánh sáng, khoảng xanh và không khí dễ chịu hiện diện trong từng buổi sáng và mỗi khoảng nghỉ.',
    'Light, greenery, and fresh air are present in every morning and every pause.',
  ],
  [
    'Đội ngũ luôn sẵn sàng khi bạn cần và lùi lại khi bạn muốn giữ trọn khoảng riêng.',
    'Our team is ready when needed and discreet when you want your own space.',
  ],
  [
    'Tiện nghi cụ thể được trình bày tại từng hạng phòng và trang tiện nghi, giúp bạn kiểm tra đầy đủ trước khi lựa chọn.',
    'Detailed amenities are shown on each room type and the amenities page, helping you check everything before choosing.',
  ],
  ['Xem toàn bộ tiện nghi', 'View all amenities'],
  ['Tìm hiểu về chúng tôi', 'Learn about us'],

  ['Không gian mùa xuân trong trẻo vào buổi sáng tại The Serene Villa', 'A fresh spring morning space at The Serene Villa'],
  ['Khung cảnh mùa hạ ngập nắng vào buổi chiều tại The Serene Villa', 'A sunlit summer afternoon scene at The Serene Villa'],
  ['Không gian mùa thu ấm áp khi ngày dần khép lại tại The Serene Villa', 'A warm autumn space as the day comes to a close at The Serene Villa'],

  ['Một giấc ngủ sâu hơn', 'A deeper sleep'],
  ['Sự yên tĩnh còn ở lại', 'Quiet that stays with you'],
  ['Giá trị của sự riêng tư', 'The value of privacy'],
  ['Một nhịp sống chậm hơn', 'A slower rhythm'],
  ['Thời gian được cảm nhận trọn vẹn', 'Time fully felt'],
  ['Giá trị của thiên nhiên', 'The value of nature'],
  ['Một cảm giác được tôn trọng', 'A feeling of being respected'],
  ['Chăm sóc không đồng nghĩa với làm phiền', 'Care does not mean interruption'],
  ['Giá trị của sự đồng hành', 'The value of thoughtful companionship'],
  [
    'Không gian đủ tĩnh để cơ thể được nghỉ ngơi, tâm trí chậm lại và một ngày mới bắt đầu nhẹ nhàng hơn.',
    'A quiet enough space for the body to rest, the mind to slow down, and a new day to begin more gently.',
  ],
  [
    'Không cần chạy theo lịch trình dày đặc. Bạn có thể đọc một trang sách lâu hơn, ngắm ánh sáng đổi màu và tận hưởng từng khoảng lặng.',
    'No need to chase a crowded schedule. You can linger over a page, watch the light change, and enjoy each quiet pause.',
  ],
  [
    'Luôn có người sẵn sàng khi cần, nhưng khoảng riêng của bạn vẫn được giữ nguyên trong suốt kỳ lưu trú.',
    'Someone is always ready when needed, while your private space remains protected throughout the stay.',
  ],

  ['Không gian lưu trú dành cho', 'A stay space for'],
  ['Dịch vụ thuê thêm', 'Add-on services'],
  ['Chọn trước để đội ngũ chuẩn bị đúng giờ nhận phòng.', 'Choose in advance so our team can prepare everything by check-in.'],
  ['Chọn ngày lưu trú', 'Choose stay dates'],
  ['Chọn ngày lưu trú trước', 'Choose stay dates first'],
  ['Ngày nhận phòng', 'Check-in date'],
  ['Ngày trả phòng', 'Check-out date'],
  ['Nhận phòng sau 14:00', 'Check-in after 14:00'],
  ['Trả phòng trước 12:00', 'Check-out before 12:00'],
  ['Tối đa', 'Up to'],
  ['người', 'guests'],
  ['đêm', 'night'],
  ['phòng ngủ', 'bedroom'],
  ['giường', 'bed'],
  ['Hủy', 'Cancel'],
  ['Quay lại đăng nhập', 'Back to sign in'],
  ['Địa chỉ email', 'Email address'],
  ['Mật khẩu', 'Password'],
  ['Nhập mật khẩu của bạn', 'Enter your password'],
  ['Chưa có tài khoản?', 'No account yet?'],
  ['Đăng ký ngay', 'Register now'],
  ['Đã có tài khoản?', 'Already have an account?'],
  ['Đăng nhập ngay', 'Sign in now'],
]

const allTextPairs = [
  ...textPairs,
  ...customerPageTextPairs,
  ...supplementalTextPairs,
  ...priorityHomepageTextPairs,
  ...priorityAboutTextPairs,
]

const byLocale: Record<Locale, Map<string, string>> = {
  vi: new Map(allTextPairs.map(([vi, en]) => [en, vi])),
  en: new Map(allTextPairs),
}

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim()

const normalizedByLocale: Record<Locale, Map<string, string>> = {
  vi: new Map(allTextPairs.map(([vi, en]) => [normalizeText(en), vi])),
  en: new Map(allTextPairs.map(([vi, en]) => [normalizeText(vi), en])),
}

const skippedTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE'])

function translateValue(value: string, dictionary: Map<string, string>) {
  let next = value
  const trimmed = value.trim()
  const normalizedDictionary = dictionary === byLocale.vi ? normalizedByLocale.vi : normalizedByLocale.en
  const direct = dictionary.get(trimmed) ?? normalizedDictionary.get(normalizeText(trimmed))

  if (direct) {
    return value.replace(trimmed, direct)
  }

  for (const [source, target] of dictionary) {
    if (next.includes(source)) {
      next = next.split(source).join(target)
    }
  }

  return next
}

function translateElement(root: ParentNode, locale: Locale) {
  const dictionary = byLocale[locale]
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent || skippedTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const textNodes: Text[] = []
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text)
  }

  for (const node of textNodes) {
    const current = node.nodeValue ?? ''
    const next = translateValue(current, dictionary)
    if (next !== current) node.nodeValue = next
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll<HTMLElement>('[placeholder], [aria-label], [title]'))] : Array.from(root.querySelectorAll<HTMLElement>('[placeholder], [aria-label], [title]'))
  for (const element of elements) {
    for (const attr of ['placeholder', 'aria-label', 'title']) {
      const current = element.getAttribute(attr)
      if (!current) continue
      const next = translateValue(current, dictionary)
      if (next !== current) element.setAttribute(attr, next)
    }
  }
}

export function ClientLocaleTextBridge({ locale }: { locale: Locale }) {
  useEffect(() => {
    translateElement(document.body, locale)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          if (mutation.target.parentNode) translateElement(mutation.target.parentNode, locale)
          continue
        }

        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) translateElement(node as Element, locale)
          if (node.nodeType === Node.TEXT_NODE && node.parentNode) translateElement(node.parentNode, locale)
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [locale])

  return null
}
