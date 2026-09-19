public class MidC {
    public static void main(String[] args) {
        int x = 1, y = 7, result = 2, n = 0;
        while (n < 5) {
            x += 2;
            if (n % 2 == 0) {
                 result += x * 2 - y--;
                 System.out.println(result--);
            } else {
                  result -= --y + x;
                  System.out.println(++result);
            }
            n++;
        }
    }
}
