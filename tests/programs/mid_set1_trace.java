public class MidA {
    public static void main(String[] args) {
        int i = 2, j = 0, sum = 1, k = 6;
        boolean flag = true;

        while (j < 6) {
                i++;
                if (flag) {
                    sum += i + k-- - j;
                    System.out.println(sum++);
                } else {
                    sum += --k - i + j;
                    System.out.println(--sum);
                }
                flag = !flag;
                j++;
        }
    }
}
